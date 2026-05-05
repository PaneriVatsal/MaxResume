import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api/v1/resumes'

def scrub_all():
    try:
        # 1. Get all resumes for the user
        r = requests.get(f"{BASE_URL}?session_id=default-user")
        r.raise_for_status()
        resumes = r.json() # Returns a list directly
        
        print(f"Found {len(resumes)} resumes to process.")
        
        count = 0
        for res in resumes:
            res_id = res['id']
            data = res['data']
            updated = False
            
            # 1. Scrub Skills
            if 'technicalSkills' in data:
                original_skills = data['technicalSkills']
                cleaned_skills = [s for s in original_skills if s not in ['Antigravity', 'Claud Code']]
                if len(cleaned_skills) != len(original_skills):
                    data['technicalSkills'] = cleaned_skills
                    updated = True
            
            # 2. Remove Specific Projects
            if 'projects' in data:
                original_projects = data['projects']
                to_remove = ['DIVY-VAHAN', 'D.W.A.R.', 'AUTO RETRACTABLE GATE', 'STAIR CLIMBING WHEELCHAIR']
                cleaned_projects = [
                    p for p in original_projects 
                    if not any(name in p.get('name', '').upper() or name in p.get('description', '').upper() for name in to_remove)
                ]
                if len(cleaned_projects) != len(original_projects):
                    data['projects'] = cleaned_projects
                    updated = True
            
            if updated:
                requests.put(f"{BASE_URL}/{res_id}", json=res)
                print(f"Cleaned resume: {res_id}")
                count += 1
        
        print(f"Total resumes updated: {count}")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    scrub_all()
