import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Aayu AI API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./aayu_ai.db")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Vector store / RAG
    VECTOR_STORE_PATH: str = os.getenv("VECTOR_STORE_PATH", "./chroma_db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-vayosetu-key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # AI
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
