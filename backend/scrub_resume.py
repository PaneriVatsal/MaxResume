import sqlite3
import json
import os

# Absolute path to the database
DB_PATH = r"c:\Users\LP082W\.gemini\antigravity\scratch\MaxResume\data\max_resume.db"

def scrub_resumes():
    if not os.path.exists(DB_PATH):
        print(f"Error: DB not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Target both masters and any existing tailored resumes to be thorough
    cursor.execute("SELECT id, data FROM resumes")
    rows = cursor.fetchall()
    
    scrubbed_count = 0
    for row_id, data_json in rows:
        data = json.loads(data_json)
        skills = data.get('technicalSkills', [])
        
        # Case-insensitive removal of forbidden terms
        new_skills = [s for s in skills if 'antigravity' not in s.lower() and 'claud' not in s.lower()]
        
        if len(skills) != len(new_skills):
            data['technicalSkills'] = new_skills
            cursor.execute("UPDATE resumes SET data = ? WHERE id = ?", (json.dumps(data), row_id))
            scrubbed_count += 1
            print(f"Scrubbed forbidden skills from resume {row_id}")
            
    conn.commit()
    conn.close()
    print(f"Total resumes cleaned: {scrubbed_count}")

if __name__ == "__main__":
    scrub_resumes()
