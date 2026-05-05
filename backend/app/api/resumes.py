from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.models import Resume
from ..services.parser import parse_to_markdown
from ..services.llm import get_completion
from ..core.config import settings
import json
import uuid
import os

router = APIRouter()

PARSE_PROMPT = """
You are a professional resume parsing engine. Your task is to EXTRACT all relevant information from the provided Resume Markdown and POPULATE the JSON structure below.

RULES:
1. Do NOT return an empty object.
2. If a field is missing, use an empty string "" or empty array [].
3. Ensure "personalInfo" name is extracted accurately as it is used for the resume title.
4. Maintain a professional tone.

JSON Structure to Populate:
{
  "personalInfo": { "name": "", "email": "", "phone": "", "location": "", "links": [] },
  "summary": "",
  "workExperience": [ { "company": "", "role": "", "location": "", "dates": "", "descriptions": [] } ],
  "education": [ { "institution": "", "degree": "", "location": "", "dates": "" } ],
  "technicalSkills": [],
  "languages": [],
  "projects": [ { "name": "", "description": "", "link": "" } ],
  "certifications": [],
  "customSections": {}
}

Resume Markdown Content to Parse:
{markdown}
"""

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    session_id: str = Query(None),
    db: Session = Depends(get_db)
):
    if not session_id:
        session_id = str(uuid.uuid4())
    
    import sys
    print(f"DEBUG: Upload request received for {file.filename}", flush=True)
        
    content = await file.read()
    extension = os.path.splitext(file.filename)[1].lower()
    
    if extension not in [".pdf", ".docx"]:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")
    
    # 1. Parse to Markdown
    print(f"DEBUG: Starting MarkItDown conversion for {file.filename}")
    try:
        markdown_content = await parse_to_markdown(content, extension)
        print(f"DEBUG: Markdown conversion successful. Length: {len(markdown_content)}")
    except Exception as e:
        print(f"DEBUG: MarkItDown failed: {e}")
        raise HTTPException(status_code=500, detail=f"Parser Error: {e}")
    
    # 2. Parse Markdown to JSON using LLM
    print("DEBUG: Sending to LLM for JSON structuring...", flush=True)
    prompt = PARSE_PROMPT.replace("{markdown}", markdown_content)
    try:
        json_str = await get_completion([{"role": "user", "content": prompt}], response_format={"type": "json_object"})
        
        # Comprehensive cleaning of LLM response
        json_str = json_str.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()
        
        print(f"DEBUG: LLM Response (cleaned): {json_str[:200]}...", flush=True)
    except Exception as e:
        print(f"DEBUG: LLM failed: {e}", flush=True)
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {e}")
    
    try:
        resume_data = json.loads(json_str)
        # Validation: Ensure we actually got data back
        if not resume_data or not isinstance(resume_data, dict) or len(resume_data.keys()) < 2:
            print(f"DEBUG: AI returned suspiciously empty JSON: {json_str}", flush=True)
            raise ValueError("AI returned empty or incomplete data.")
    except Exception as e:
        print(f"DEBUG: JSON Load/Validation failed: {e}. Raw: {json_str}", flush=True)
        raise HTTPException(status_code=500, detail="AI failed to generate a valid resume structure. Please try again.")
        
    # 3. Store in Database
    print("DEBUG: Saving to Database...")
    try:
        new_resume = Resume(
            session_id=session_id,
            data=resume_data,
            is_master=True
        )
        db.add(new_resume)
        db.commit()
        db.refresh(new_resume)
        print(f"DEBUG: Successfully saved resume ID: {new_resume.id}")
    except Exception as e:
        print(f"DEBUG: Database Save failed: {e}")
        raise HTTPException(status_code=500, detail=f"Database Error: {e}")
    
    return {
        "id": new_resume.id,
        "session_id": session_id,
        "resume": resume_data
    }

@router.get("/")
async def list_resumes(session_id: str, db: Session = Depends(get_db)):
    resumes = db.query(Resume).filter(Resume.session_id == session_id).all()
    return resumes

@router.get("/{resume_id}")
@router.get("/{resume_id}/")
async def get_resume(resume_id: str, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume
@router.delete("/{resume_id}")
@router.delete("/{resume_id}/")
async def delete_resume(resume_id: str, db: Session = Depends(get_db)):
    from ..models.models import Improvement, Job # Ensure we can query related models
    try:
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # 1. Find all improvements for this resume
        improvements = db.query(Improvement).filter(Improvement.resume_id == resume_id).all()
        
        # 2. Get all associated job IDs
        job_ids = [imp.job_id for imp in improvements if imp.job_id]
        
        # 3. Delete improvements
        db.query(Improvement).filter(Improvement.resume_id == resume_id).delete()
        
        # 4. Delete associated jobs (if they aren't used elsewhere)
        if job_ids:
            db.query(Job).filter(Job.id.in_(job_ids)).delete(synchronize_session=False)
        
        # 5. Finally delete the resume
        db.delete(resume)
        db.commit()
        return {"status": "deleted"}
    except Exception as e:
        db.rollback()
        print(f"DEBUG: Delete failed: {e}", flush=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete: {str(e)}")

@router.put("/{resume_id}")
@router.put("/{resume_id}/")
async def update_resume(
    resume_id: str,
    payload: dict,
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Update the data field specifically
    resume.data = payload.get("data", resume.data)
    db.commit()
    db.refresh(resume)
    return resume
