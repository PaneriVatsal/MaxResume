import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.models.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM resumes")).scalar()
        print(f"Number of resumes in database: {count}")
except Exception as e:
    print(f"ERROR: {e}")
