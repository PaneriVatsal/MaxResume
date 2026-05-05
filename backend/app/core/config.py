import os
import json
from pydantic_settings import BaseSettings
from typing import Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")
CONFIG_PATH = os.path.join(DATA_DIR, "config.json")
DB_PATH = os.path.join(DATA_DIR, "max_resume.db")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Max Resume"
    DATABASE_URL: str = f"sqlite:///{DB_PATH}"
    
    # LLM Settings (will be overridden by config.json)
    LLM_PROVIDER: str = "mock"
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = ""
    
    # Feature Toggles
    GENERATE_COVER_LETTER: bool = True
    GENERATE_OUTREACH: bool = True
    
    def save_to_disk(self):
        config_data = {
            "LLM_PROVIDER": self.LLM_PROVIDER,
            "LLM_MODEL": self.LLM_MODEL,
            "OPENAI_API_KEY": self.OPENAI_API_KEY,
            "ANTHROPIC_API_KEY": self.ANTHROPIC_API_KEY,
            "GEMINI_API_KEY": self.GEMINI_API_KEY,
            "OPENROUTER_API_KEY": self.OPENROUTER_API_KEY,
            "OLLAMA_BASE_URL": self.OLLAMA_BASE_URL,
            "GENERATE_COVER_LETTER": self.GENERATE_COVER_LETTER,
            "GENERATE_OUTREACH": self.GENERATE_OUTREACH,
        }
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(CONFIG_PATH, "w") as f:
            json.dump(config_data, f, indent=4)

    @classmethod
    def load_from_disk(cls):
        instance = cls()
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r") as f:
                try:
                    config_data = json.load(f)
                    for key, value in config_data.items():
                        if hasattr(instance, key) and value is not None:
                            setattr(instance, key, value)
                except json.JSONDecodeError:
                    pass
        return instance

settings = Settings.load_from_disk()
