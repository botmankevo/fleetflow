from fastapi import APIRouter, HTTPException
from app.core.security import create_access_token, verify_token
import hashlib
import hmac
import secrets
from app.schemas.auth import DevLoginRequest, DevLoginResponse, MeResponse, LoginRequest
from app.services.airtable import AirtableClient

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/dev-login", response_model=DevLoginResponse)
def dev_login(payload: DevLoginRequest):
    carrier_record_id = payload.carrier_record_id
    if not carrier_record_id and payload.carrier_code:
        try:
            airtable = AirtableClient()
            carrier_record_id = airtable.find_carrier_record_id(payload.carrier_code)
        except Exception:
            carrier_record_id = None

    if not carrier_record_id:
        raise HTTPException(status_code=400, detail="Invalid carrier code or record id")

    token = create_access_token(
        {
            "email": payload.email,
            "role": payload.role,
            "carrier_record_id": carrier_record_id,
        }
    )
    return {"access_token": token, "token_type": "bearer"}


def _verify_password(plain: str, stored: str) -> bool:
    # Format: pbkdf2$<salt_hex>$<hash_hex>
    if stored.startswith("pbkdf2$"):
        try:
            _, salt_hex, hash_hex = stored.split("$", 2)
            salt = bytes.fromhex(salt_hex)
            expected = bytes.fromhex(hash_hex)
            derived = hashlib.pbkdf2_hmac("sha256", plain.encode("utf-8"), salt, 120_000)
            return hmac.compare_digest(derived, expected)
        except Exception:
            return False
    # Fallback to plain (internal-only convenience)
    return hmac.compare_digest(plain, stored)


@router.post("/login", response_model=DevLoginResponse)
def login(payload: LoginRequest):
    airtable = AirtableClient()
    user = airtable.find_user_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    fields = user.get("fields", {})
    stored_password = fields.get("Password")
    role = fields.get("Role")
    carrier_links = fields.get("Carrier", [])
    carrier_record_id = carrier_links[0] if carrier_links else None

    if not stored_password or not role or not carrier_record_id:
        raise HTTPException(status_code=400, detail="User record incomplete")

    if not _verify_password(payload.password, stored_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(
        {
            "email": payload.email,
            "role": role,
            "carrier_record_id": carrier_record_id,
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
