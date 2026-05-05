import os
import litellm
import json
from ..core.config import settings
from typing import Dict, Any, List

async def get_completion(messages: List[Dict[str, str]], response_format: Any = None) -> str:
    """
    Refined completion wrapper with explicit provider/model handling and no silent fallbacks.
    """
    # 1. Sync environment keys from current settings (enables live updates from UI)
    if settings.OPENAI_API_KEY:
        os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
    if settings.ANTHROPIC_API_KEY:
        os.environ["ANTHROPIC_API_KEY"] = settings.ANTHROPIC_API_KEY
    if settings.GEMINI_API_KEY:
        os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
    if settings.OPENROUTER_API_KEY:
        os.environ["OPENROUTER_API_KEY"] = settings.OPENROUTER_API_KEY

    provider = settings.LLM_PROVIDER.lower()
    model = settings.LLM_MODEL
    
    # 1. Handle Mock Provider for development/testing
    if provider == "mock":
        return await _get_mock_completion(messages)

    # 2. Explicit error if no model is configured
    if not model:
        raise ValueError(
            f"No LLM model configured for provider '{provider}'. "
            "Please select a model in settings."
        )
    
    is_ollama = provider == "ollama"
    api_base = settings.OLLAMA_BASE_URL if is_ollama else None

    # LiteLLM requires "ollama/" prefix for Ollama
    if is_ollama and not model.startswith("ollama/"):
        model = f"ollama/{model}"

    # Handle JSON format mapping: Ollama uses format="json" not response_format object
    extra_kwargs = {}
    if response_format and response_format.get("type") == "json_object":
        if is_ollama:
            extra_kwargs["format"] = "json"
        else:
            extra_kwargs["response_format"] = response_format

    try:
        response = await litellm.acompletion(
            model=model,
            messages=messages,
            api_base=api_base,
            **extra_kwargs
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"DEBUG: LiteLLM Error ({provider}): {e}", flush=True)
        raise

async def _get_mock_completion(messages: List[Dict[str, str]]) -> str:
    """
    Returns valid JSON mock responses for development.
    Handles Parsing, Matching, and Refinement distinctly.
    """
    last_msg = messages[-1]["content"].lower()
    
    # Base professional data used for mocks
    base_resume = {
        "personalInfo": {
            "name": "Vatsal Paneri",
            "email": "vatsal@example.com",
            "phone": "+1 (555) 000-0000",
            "location": "New York, NY",
            "links": ["linkedin.com/in/vatsal"]
        },
        "summary": "Experienced professional with a strong background in software development and project management.",
        "workExperience": [
            {
                "company": "Tech Solutions Inc.",
                "role": "Senior Developer",
                "location": "San Francisco, CA",
                "dates": "2020 - Present",
                "descriptions": [
                    "Led a team of 5 developers to build a scalable SaaS platform.",
                    "Improved system performance by 40% through optimization."
                ]
            }
        ],
        "education": [
            {
                "institution": "University of Technology",
                "degree": "B.S. in Computer Science",
                "location": "Boston, MA",
                "dates": "2016 - 2020"
            }
        ],
        "technicalSkills": ["Python", "JavaScript", "React", "Node.js", "FastAPI"],
        "languages": ["English", "Hindi"],
        "projects": [],
        "certifications": [],
        "customSections": {}
    }

    # CASE 1: MATCHING (Propose Diffs)
    if "targeted improvements" in last_msg or "changes" in last_msg:
        return json.dumps([
            {
                "path": "summary",
                "action": "replace",
                "value": "Strategic Software Architect specializing in AI-driven solutions and precision engineering. Expert at aligning technical roadmaps with business objectives.",
                "reason": "Aligns better with the Job Description's emphasis on strategy and AI."
            },
            {
                "path": "workExperience.0.descriptions.0",
                "action": "replace",
                "value": "Spearheaded the development of a state-of-the-art AI parsing engine, leveraging LLMs to optimize candidate matching by 85%.",
                "reason": "Emphasizes AI leadership and measurable impact requested by the JD."
            }
        ])

    # CASE 2: REFINEMENT (The Final Polished Resume)
    if "refine" in last_msg or "polish" in last_msg or "alignment check" in last_msg:
        refined = base_resume.copy()
        refined["summary"] = "Strategic Software Architect specializing in AI-driven solutions and precision engineering. Expert at aligning technical roadmaps with business objectives. (REFINED)"
        refined["workExperience"][0]["descriptions"][0] = "Spearheaded the development of a state-of-the-art AI parsing engine, leveraging LLMs to optimize candidate matching by 85%. (REFINED)"
        return json.dumps(refined)

    # CASE 3: PARSING (Initial Upload)
    if "convert" in last_msg or "extract" in last_msg or "resume data" in last_msg:
        return json.dumps(base_resume)

    # Default fallback to base resume instead of a success message
    return json.dumps(base_resume)
