import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM improvements"))
        conn.execute(text("DELETE FROM resumes"))
        conn.commit()
    print("SUCCESS: All resumes and improvements deleted.")
except Exception as e:
    print(f"ERROR: {e}")
