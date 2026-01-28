from pydantic import BaseModel
from typing import Optional


class DevLoginRequest(BaseModel):
    email: str
    role: str
    carrier_id: int | None = None
    carrier_code: str | None = None
    carrier_name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class DevLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    email: str
    role: str
    carrier_id: int
    driver_id: Optional[int] = None
    user_id: int


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
