from pydantic_settings import BaseSettings
from pydantic import AnyUrl
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "FleetFlow Dispatch Portal"
    environment: str = "development"
    database_url: AnyUrl
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_exp_minutes: int = 60 * 12
    dropbox_access_token: str
    airtable_enabled: bool = False
    airtable_api_key: Optional[str] = None
    airtable_base_id: Optional[str] = None
    google_maps_api_key: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_pass: Optional[str] = None
    app_base_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
