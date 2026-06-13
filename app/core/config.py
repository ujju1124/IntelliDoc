"""Configuration module for loading environment variables."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    GROQ_API_KEY: str
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str
    UPSTASH_REDIS_URL: str
    UPSTASH_REDIS_TOKEN: str
    DATABASE_URL: str = "sqlite:///./app.db"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
