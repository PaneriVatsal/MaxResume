from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from .models.database import engine, Base
from .models import models
from .core.config import settings
import time

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# Deep Logger Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    print(f"DEBUG: Incoming {request.method} request to {request.url.path}", flush=True)
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    print(f"DEBUG: Completed {request.method} {request.url.path} in {process_time:.2f}ms with status {response.status_code}", flush=True)
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/api/v1/config")
def get_config():
    return {
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL,
        "openai_api_key": settings.OPENAI_API_KEY,
        "anthropic_api_key": settings.ANTHROPIC_API_KEY,
        "gemini_api_key": settings.GEMINI_API_KEY,
        "openrouter_api_key": settings.OPENROUTER_API_KEY,
        "ollama_base_url": settings.OLLAMA_BASE_URL,
        "generate_cover_letter": settings.GENERATE_COVER_LETTER,
        "generate_outreach": settings.GENERATE_OUTREACH,
    }

@app.post("/api/v1/config")
def update_config(config: dict):
    for key, value in config.items():
        # Convert frontend lowercase keys to backend uppercase keys
        attr_name = key.upper()
        if hasattr(settings, attr_name):
            setattr(settings, attr_name, value)
    settings.save_to_disk()
    return {"status": "updated", "config": settings.dict()}

# Import and include routers
from .api import resumes, improvements, tools, stats
app.include_router(resumes.router, prefix="/api/v1/resumes", tags=["resumes"])
app.include_router(improvements.router, prefix="/api/v1/improvements", tags=["improvements"])
app.include_router(tools.router, prefix="/api/v1/tools", tags=["tools"])
app.include_router(stats.router, prefix="/api/v1/stats", tags=["stats"])
