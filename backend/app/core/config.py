import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration."""
    
    # App
    APP_NAME: str = "FleetFlow"
    APP_BASE_URL: str = "http://localhost:3000"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@postgres:5432/fleetflow"
    
    # JWT
    JWT_SECRET: str = "your-secret-key-change-in-prod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Dropbox
    DROPBOX_ACCESS_TOKEN: str = ""
    
    # Airtable
    AIRTABLE_ENABLED: bool = False
    AIRTABLE_TOKEN: Optional[str] = None
    AIRTABLE_BASE_ID: Optional[str] = None
    
    # Google Maps
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    
    # SMTP
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    SMTP_FROM: str = "noreply@fleetflow.app"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
