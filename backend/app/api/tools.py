from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.models import Resume, Job
from ..services.tools import generate_cover_letter, generate_outreach, get_enrichment_questions
from ..services.exporter import get_pdf_bytes
from fastapi.responses import Response

router = APIRouter()

@router.post("/cover-letter")
async def cover_letter(resume_id: str, job_id: str, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    job = db.query(Job).filter(Job.id == job_id).first()
    if not resume or not job:
        raise HTTPException(status_code=404, detail="Resume or Job not found")
    
    content = await generate_cover_letter(resume.data, job.description)
    return {"content": content}

@router.post("/outreach")
async def outreach(resume_id: str, job_id: str, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    job = db.query(Job).filter(Job.id == job_id).first()
    if not resume or not job:
        raise HTTPException(status_code=404, detail="Resume or Job not found")
    
    message = await generate_outreach(resume.data, job.description)
    return {"message": message}

@router.post("/enrich-bullet")
async def enrich_bullet(bullet: str):
    questions = await get_enrichment_questions(bullet)
    return {"questions": questions}

@router.get("/export/{resume_id}")
async def export_pdf(resume_id: str, locale: str = "en"):
    # This assumes the frontend is running on port 3000
    url = f"http://localhost:3000/{locale}/print/{resume_id}"
    pdf_bytes = await get_pdf_bytes(url)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=resume_{resume_id}.pdf"}
    )
