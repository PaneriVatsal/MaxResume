from .llm import get_completion
import json

COVER_LETTER_PROMPT = """
Write a professional, targeted cover letter based on the following resume and job description.
The tone should be confident, Swiss-precision, and brutalist (direct, no fluff).

Job Description:
{job_desc}

Resume Data:
{resume_data}

Return the cover letter in Markdown format.
"""

OUTREACH_PROMPT = """
Generate a short, high-impact LinkedIn outreach message to a hiring manager for this role.
Use the resume and JD to mention a specific value add.

Job Description:
{job_desc}

Resume Data:
{resume_data}

Return the message in a JSON object: {{ "message": "" }}
"""

ENRICH_PROMPT = """
Analyze the following resume bullet point and suggest 3 clarifying questions to help the user rewrite it using the STAR method (Situation, Task, Action, Result) for maximum impact.

Bullet Point:
{bullet}

Return the questions in a JSON list: [ "", "", "" ]
"""

async def generate_cover_letter(resume_data: dict, job_desc: str) -> str:
    prompt = COVER_LETTER_PROMPT.format(resume_data=json.dumps(resume_data), job_desc=job_desc)
    return await get_completion([{"role": "user", "content": prompt}])

async def generate_outreach(resume_data: dict, job_desc: str) -> str:
    prompt = OUTREACH_PROMPT.format(resume_data=json.dumps(resume_data), job_desc=job_desc)
    res = await get_completion([{"role": "user", "content": prompt}], response_format={"type": "json_object"})
    try:
        return json.loads(res)["message"]
    except:
        return res

async def get_enrichment_questions(bullet: str) -> list:
    prompt = ENRICH_PROMPT.format(bullet=bullet)
    res = await get_completion([{"role": "user", "content": prompt}], response_format={"type": "json_object"})
    try:
        return json.loads(res)
    except:
        return ["Could you quantify the result?", "What was the specific challenge?", "What tools did you use?"]
