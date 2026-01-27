from pydantic import BaseModel
from typing import Optional


class DevLoginRequest(BaseModel):
    email: str
    role: str
    carrier_record_id: str | None = None
    carrier_code: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class DevLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    email: str
    role: str
    carrier_record_id: str
    driver_record_id: Optional[str] = None
