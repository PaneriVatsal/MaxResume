from sqlalchemy import Column, String, JSON, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.mutable import MutableDict, MutableList
import uuid
from datetime import datetime
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, index=True) # For identifying user session
    data = Column(MutableDict.as_mutable(JSON)) # The structured resume data
    is_master = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    improvements = relationship("Improvement", back_populates="resume", cascade="all, delete-orphan")

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, index=True)
    description = Column(String)
    metadata_json = Column(MutableDict.as_mutable(JSON), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    improvements = relationship("Improvement", back_populates="job")

class Improvement(Base):
    __tablename__ = "improvements"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    resume_id = Column(String, ForeignKey("resumes.id"))
    job_id = Column(String, ForeignKey("jobs.id"))
    diff = Column(MutableList.as_mutable(JSON))
    stats = Column(MutableDict.as_mutable(JSON))
    status = Column(String, default="preview") # preview, confirmed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    resume = relationship("Resume", back_populates="improvements")
    job = relationship("Job", back_populates="improvements")
