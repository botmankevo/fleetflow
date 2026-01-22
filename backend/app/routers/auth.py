from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr

from app.core.security import create_access_token, get_current_user

router = APIRouter()


class DevLoginRequest(BaseModel):
    email: EmailStr
    role: Literal["Admin", "Dispatcher", "Driver"]
    carrier_id: str


@router.post("/dev-login")
def dev_login(payload: DevLoginRequest) -> dict:
    token_payload = {
        "email": payload.email,
        "role": payload.role,
        "carrier_id": payload.carrier_id,
        "carrier_internal_id": payload.carrier_id,
    }
    token = create_access_token(token_payload)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user
