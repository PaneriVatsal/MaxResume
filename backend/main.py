from fastapi import FastAPI
from pydantic import BaseModel
import sqlite3

app = FastAPI()

# SQLite setup
conn = sqlite3.connect('data.db')
c = conn.cursor()
c.execute('''CREATE TABLE IF NOT EXISTS resumes
            (id INTEGER PRIMARY KEY, content TEXT)''')
conn.commit()

class Resume(BaseModel):
    content: str

@app.post("/upload")
def upload_resume(resume: Resume):
    c.execute("INSERT INTO resumes (content) VALUES (?)", (resume.content,))
    conn.commit()
    return {"message": "Resume uploaded successfully"}

@app.get("/resumes/{id}")
def get_resume(id: int):
    c.execute("SELECT content FROM resumes WHERE id = ?", (id,))
    result = c.fetchone()
    if result:
        return {"content": result[0]}
    else:
        return {"message": "Resume not found"}
