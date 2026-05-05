import urllib.request
import json
import time

resume_id = "8fb1764c-eafd-4956-90f8-4ba264c704bd"
job_desc = "Software Engineer with experience in Python and FastAPI. Knowledge of local LLMs like Gemma is a plus."

data = json.dumps({
    "resume_id": resume_id,
    "job_description": job_desc
}).encode('utf-8')

req = urllib.request.Request(
    'http://localhost:8000/api/v1/improvements/match/',
    data=data,
    headers={'Content-Type': 'application/json'},
    method='POST'
)

print(f"Sending match request for resume {resume_id}...")
start_time = time.time()
try:
    response = urllib.request.urlopen(req, timeout=300)
    print(f"Success in {time.time() - start_time:.2f}s")
    print(json.loads(response.read().decode()))
except Exception as e:
    print(f"Failed in {time.time() - start_time:.2f}s: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode())
