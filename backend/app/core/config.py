import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "MAIN TMS"
    FLEETFLOW_ENV: str = "dev"
    JWT_SECRET: str = "change-me"
    TOKEN_EXP_MINUTES: int = 1440
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///./app.db"
    
    # PostgreSQL settings (for Docker)
    POSTGRES_DB: str = "fleetflow"
    POSTGRES_USER: str = "fleetflow"
    POSTGRES_PASSWORD: str = "fleetflow"

    AIRTABLE_PAT: str = ""
    AIRTABLE_BASE_ID: str = ""
    AIRTABLE_TABLE_USERS: str = "Users"
    AIRTABLE_TABLE_DRIVERS: str = "Drivers"
    AIRTABLE_TABLE_LOADS: str = "Loads"
    AIRTABLE_TABLE_CARRIERS: str = "Carriers"
    AIRTABLE_TABLE_MAINTENANCE: str = "Maintenance"
    AIRTABLE_TABLE_EXPENSES: str = "Expenses"

    DROPBOX_ACCESS_TOKEN: str = ""
    DROPBOX_ROOT_FOLDER: str = "/FleetFlow"

    GOOGLE_MAPS_API_KEY: str = ""
    MAPBOX_API_KEY: str = ""
    FMCSA_API_KEY: str = ""

    ENABLE_AIRTABLE: bool = False
    ENABLE_DROPBOX: bool = True
    ENABLE_GOOGLE_MAPS: bool = True
    ENABLE_MAPBOX: bool = True

    # AI Features
    AI_PROVIDER: str = "mock"
    OPENAI_API_KEY: str = ""
    
    # Feature Flags
    DEMO_MODE: bool = True
    CUSTOMER_PORTAL_ENABLED: bool = True
    
    # Frontend (can be in .env but not used by backend)
    NEXT_PUBLIC_API_BASE: str = "http://127.0.0.1:8000"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields in .env


settings = Settings()
