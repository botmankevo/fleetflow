import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    FLEETFLOW_ENV: str = "dev"
    JWT_SECRET: str = "change-me"
    TOKEN_EXP_MINUTES: int = 1440

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

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
