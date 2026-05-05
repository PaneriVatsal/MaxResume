from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.database import get_db
from ..models.models import Resume, Improvement

router = APIRouter()

@router.get("/")
async def get_stats(session_id: str, db: Session = Depends(get_db)):
    # 1. Total Resumes
    total_resumes = db.query(Resume).filter(Resume.session_id == session_id).count()
    
    # 2. Total Improvements (Matches Generated)
    # We join with Resume to ensure we only count for the specific session_id
    improvements = db.query(Improvement)\
        .join(Resume, Improvement.resume_id == Resume.id)\
        .filter(Resume.session_id == session_id)\
        .all()
    
    total_matches = len(improvements)
    
    # 3. Average Alignment Score (Success Rate)
    # Extract 'initial_match' from the stats JSON field for each improvement
    scores = []
    for imp in improvements:
        if imp.stats and "initial_match" in imp.stats:
            try:
                scores.append(float(imp.stats["initial_match"]))
            except (ValueError, TypeError):
                continue
                
    avg_score = 0
    if scores:
        avg_score = round(sum(scores) / len(scores))
    
    return {
        "total_resumes": total_resumes,
        "total_matches": total_matches,
        "success_rate": avg_score
    }
