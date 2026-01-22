import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = BASE_DIR / ".env"
load_dotenv(ENV_PATH)

AIRTABLE_PAT = os.getenv("AIRTABLE_PAT", "")
AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID", "")
JWT_SECRET = os.getenv("JWT_SECRET", "")
TOKEN_EXP_MINUTES = int(os.getenv("TOKEN_EXP_MINUTES", "1440"))
FLEETFLOW_ENV = os.getenv("FLEETFLOW_ENV", "dev")
