from fastapi import APIRouter, HTTPException
from app.core.security import create_access_token, verify_token
from app.schemas.auth import DevLoginRequest, DevLoginResponse, MeResponse
from app.services.airtable import AirtableClient

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/dev-login", response_model=DevLoginResponse)
def dev_login(payload: DevLoginRequest):
    token = create_access_token(
        {
            "email": payload.email,
            "role": payload.role,
            "carrier_record_id": payload.carrier_record_id,
        }
    )
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=MeResponse)
def me(token: dict = verify_token):
    email = token.get("email")
    role = token.get("role")
    carrier_record_id = token.get("carrier_record_id")
    if not email or not role or not carrier_record_id:
        raise HTTPException(status_code=400, detail="Invalid token payload")

    driver_record_id = None
    try:
        airtable = AirtableClient()
        driver_record_id = airtable.find_driver_record_id(email, carrier_record_id)
    except Exception:
        driver_record_id = None

    return {
        "email": email,
        "role": role,
        "carrier_record_id": carrier_record_id,
        "driver_record_id": driver_record_id,
    }
