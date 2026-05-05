from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Any
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.models import Resume, Job, Improvement
from ..services.llm import get_completion
from ..core.config import settings
import json
import hashlib
import uuid

from pydantic import BaseModel

router = APIRouter()

class MatchRequest(BaseModel):
    resume_id: str
    job_description: str

class ConfirmRequest(BaseModel):
    improvement_id: str
    preview_hash: str

MATCH_PROMPT = """
You are a career expert at Max Resume. Compare the master resume with the job description and propose targeted improvements.

STRICT RULES:
1. You MAY modify: 'summary', 'workExperience', 'technicalSkills', 'projects'
2. NEVER modify or remove: 'education', 'personalInfo', 'certifications', 'languages'
3. If you add a new bullet to workExperience, remove the least relevant existing one. Keep total bullet count per job identical.
4. Do not fabricate experience, numbers, or achievements not implied by the original resume.
5. Strip buzzwords: leverage, synergy, innovate, passionate, excited, dynamic.
6. For projects, only modify the 'description' field, never remove a project entirely.

Job Description:
{job_desc}

Resume Data:
{resume_data}

Return a JSON object with exactly two fields:
1. "alignment_score": integer 0-100 of current fit before changes.
2. "changes": list of improvements:
   [ { "path": "workExperience.0.descriptions.0", "action": "replace", "value": "new text", "reason": "why" } ]

Valid paths:
- summary
- workExperience.X.descriptions.Y
- technicalSkills
- projects.X.description
"""

REFINE_PROMPT = """
You are a resume polisher. Refine the following resume data to:
1. Inject missing keywords from the Job Description.
2. Strip AI buzzwords (leverage, synergy, innovate, passionate, etc.).
3. Ensure absolute alignment with facts - do not fabricate experience.

Job Description:
{job_desc}

Resume Data (Pre-Refined):
{resume_data}

Return the COMPLETE refined resume JSON.
"""

def generate_payload_hash(payload: dict) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

def apply_patch(data: Any, path: str, action: str, value: Any) -> Any:
    """
    Surgically applies a change to a nested dictionary/list structure.
    Path format: 'workExperience.0.role'
    """
    # Safety redirection for common AI hallucinations
    if "experience descriptions" in path:
        path = path.replace("experience descriptions", "workExperience.0.descriptions")
    
    parts = path.split('.')
    curr = data
    
    # Traverse to the parent of the target field
    for i in range(len(parts) - 1):
        part = parts[i]
        if part.isdigit():
            idx = int(part)
            if isinstance(curr, list) and idx < len(curr):
                curr = curr[idx]
            elif isinstance(curr, list) and action == "add":
                # If we're adding and the index doesn't exist, append a new object
                new_obj = {}
                curr.append(new_obj)
                curr = new_obj
            else:
                return data # Path invalid
        else:
            if isinstance(curr, dict):
                if part not in curr and action == "add":
                    curr[part] = [] if parts[i+1].isdigit() else {}
                curr = curr[part]
            else:
                return data # Path invalid
                
    # Apply the action to the target field
    last_part = parts[-1]
    if last_part.isdigit():
        idx = int(last_part)
        if isinstance(curr, list):
            if action == "replace":
                if idx < len(curr): curr[idx] = value
            elif action == "add":
                # Ensure new objects have a stable ID
                if isinstance(value, dict) and "id" not in value:
                    value["id"] = str(uuid.uuid4())
                curr.insert(idx, value)
    else:
        if isinstance(curr, dict):
            if action == "replace":
                curr[last_part] = value
            elif action == "add":
                # Ensure new objects have a stable ID
                if isinstance(value, dict) and "id" not in value:
                    value["id"] = str(uuid.uuid4())
                # Ensure the field is a list if we're adding to it
                if last_part not in curr:
                    curr[last_part] = [value]
                elif isinstance(curr[last_part], list):
                    curr[last_part].append(value)
                else:
                    # If it's a value but we're adding, convert to list or just set it
                    curr[last_part] = value
                    
    return data

@router.post("/match")
@router.post("/match/")
async def generate_match(
    request: MatchRequest = Body(...),
    db: Session = Depends(get_db)
):
    import sys
    print(f"DEBUG: Match request received for resume {request.resume_id}", flush=True)
    resume_id = request.resume_id
    job_description = request.job_description
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # 1. Create Job record
    job = Job(session_id=resume.session_id, description=job_description)
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # 2. Generate Diff (Optimized Pass 1+2)
    prompt = MATCH_PROMPT.replace("{job_desc}", job_description).replace("{resume_data}", json.dumps(resume.data))
    diff_str = await get_completion([{"role": "user", "content": prompt}], response_format={"type": "json_object"})
    
    def get_value_at_path(obj: Any, path: str) -> Any:
        try:
            parts = path.split('.')
            for part in parts:
                if part.isdigit():
                    obj = obj[int(part)]
                else:
                    obj = obj[part]
            return obj
        except:
            return None

    try:
        diff = json.loads(diff_str)
        # Robustly handle different LLM JSON formats
        if isinstance(diff, dict):
            # Extract alignment score if present
            alignment_score = diff.get("alignment_score", 45)
            
            if "changes" in diff:
                diff = diff["changes"]
            elif "improvements" in diff:
                diff = diff["improvements"]
            elif len(diff.keys()) == 1:
                key = list(diff.keys())[0]
                if isinstance(diff[key], list):
                    diff = diff[key]
        else:
            alignment_score = 45
        
        if not isinstance(diff, list):
            diff = [diff] if diff else []
            
        # Add old values for UI context
        for item in diff:
            if isinstance(item, dict) and "path" in item:
                item["oldValue"] = get_value_at_path(resume.data, item["path"])
            
        print(f"DEBUG: Processed {len(diff)} improvement steps with context", flush=True)
    except Exception as e:
        print(f"DEBUG: Diff parsing failed: {e}. Raw: {diff_str}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to generate match diff.")
        
    # 3. Store preview improvement
    improvement = Improvement(
        resume_id=resume.id,
        job_id=job.id,
        diff=diff,
        stats={"initial_match": alignment_score}, 
        status="preview"
    )
    db.add(improvement)
    db.commit()
    db.refresh(improvement)
    
    # Generate hash for security verification later
    preview_hash = generate_payload_hash(diff)
    
    return {
        "improvement_id": improvement.id,
        "diff": diff,
        "preview_hash": preview_hash
    }

@router.post("/confirm")
@router.post("/confirm/")
async def confirm_match(
    request: ConfirmRequest = Body(...),
    db: Session = Depends(get_db)
):
    improvement_id = request.improvement_id
    preview_hash = request.preview_hash
    improvement = db.query(Improvement).filter(Improvement.id == improvement_id).first()
    if not improvement:
        raise HTTPException(status_code=404, detail="Improvement not found")
        
    # Security check: Verify hash against preview
    current_hash = generate_payload_hash(improvement.diff)
    if current_hash != preview_hash:
        raise HTTPException(status_code=400, detail="Payload tampering detected.")
        
    # 1. Apply Diff to Resume Data
    import copy
    resume = improvement.resume
    job = improvement.job
    final_data = copy.deepcopy(resume.data)
    
    # Surgically apply every proposed change
    diff = improvement.diff
    if isinstance(diff, list):
        for change in diff:
            path = change.get("path")
            action = change.get("action")
            value = change.get("value")
            if path and action and value:
                final_data = apply_patch(final_data, path, action, value)
    
    # 2. (Optional) Final Refinement Pass (Alignment Check)
    # We skip the placeholder refinement for now to ensure the diffs are applied clearly.
    
    # 3. Create new tailored Resume record
    tailored_resume = Resume(
        session_id=resume.session_id,
        data=final_data,
        is_master=False
    )
    db.add(tailored_resume)
    
    # 4. Generate Supporting Documents
    cover_letter = None
    outreach_message = None
    
    if settings.GENERATE_COVER_LETTER:
        cl_prompt = f"Write a professional cover letter for this job description: {job.description}\n\nBased on this resume: {json.dumps(final_data)}\n\nReturn plain text only, no JSON."
        cover_letter = await get_completion([{"role": "user", "content": cl_prompt}])
        
    if settings.GENERATE_OUTREACH:
        # Use summary or first job description as background
        summary = final_data.get("summary", "")
        out_prompt = f"Write a short LinkedIn outreach message (under 150 words) for this job: {job.description}\n\nApplicant background: {summary}\n\nReturn plain text only."
        outreach_message = await get_completion([{"role": "user", "content": out_prompt}])

    improvement.status = "confirmed"
    db.commit()
    
    return {
        "tailored_resume_id": tailored_resume.id,
        "data": final_data,
        "cover_letter": cover_letter,
        "outreach_message": outreach_message
    }
