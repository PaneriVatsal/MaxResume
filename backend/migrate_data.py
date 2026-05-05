from app.models.database import SessionLocal
from app.models.models import Resume
import json

def migrate():
    db = SessionLocal()
    r = db.query(Resume).filter(Resume.is_master == True).first()
    if not r:
        print("No master resume found")
        return

    data = r.data
    edu = data.get('education', [])
    certs = data.get('certifications', [])

    # 1. Migrate IIT Patna to Certs
    new_edu = []
    for school in edu:
        if 'IIT Patna' in school['institution']:
            certs.append({
                'name': school['degree'],
                'issuer': school['institution'],
                'date': school.get('dates') or '[Year]'
            })
        else:
            # 2. Add placeholders for missing years
            if not school.get('dates'):
                school['dates'] = '[Year]'
            new_edu.append(school)
    
    data['education'] = new_edu
    data['certifications'] = certs
    
    # 3. Final typo check for skills
    if 'technicalSkills' in data:
        data['technicalSkills'] = [s.replace('Claud Code', 'Claude Code') for s in data['technicalSkills']]

    r.data = data
    db.commit()
    print("Migration and Cleanup Successful!")

if __name__ == "__main__":
    migrate()
