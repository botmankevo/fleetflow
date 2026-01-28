from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.security import create_access_token, verify_token, hash_password, verify_password
from app.core.database import get_db
import secrets
from app.schemas.auth import DevLoginRequest, DevLoginResponse, MeResponse, LoginRequest, ChangePasswordRequest
from app import models

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/dev-login", response_model=DevLoginResponse)
def dev_login(payload: DevLoginRequest, db: Session = Depends(get_db)):
    carrier = None
    if payload.carrier_id:
        carrier = db.query(models.Carrier).filter(models.Carrier.id == payload.carrier_id).first()
    if not carrier and payload.carrier_code:
        carrier = db.query(models.Carrier).filter(models.Carrier.internal_code == payload.carrier_code).first()
    if not carrier and payload.carrier_name:
        carrier = db.query(models.Carrier).filter(models.Carrier.name == payload.carrier_name).first()

    if not carrier:
        carrier = models.Carrier(
            name=payload.carrier_name or payload.carrier_code or "FleetFlow Carrier",
            internal_code=payload.carrier_code,
        )
        db.add(carrier)
        db.commit()
        db.refresh(carrier)

    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        temp_password = secrets.token_hex(12)
        user = models.User(
            email=payload.email,
            password_hash=hash_password(temp_password),
            role=payload.role,
            carrier_id=carrier.id,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(
        {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "carrier_id": carrier.id,
            "driver_id": user.driver_id,
        }
    )
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=DevLoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email, models.User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(
        {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "carrier_id": user.carrier_id,
            "driver_id": user.driver_id,
        }
    )
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=MeResponse)
def me(token: dict = Depends(verify_token)):
    email = token.get("email")
    role = token.get("role")
    carrier_id = token.get("carrier_id")
    user_id = token.get("user_id")
    if not email or not role or not carrier_id or not user_id:
        raise HTTPException(status_code=400, detail="Invalid token payload")

    return {
        "email": email,
        "role": role,
        "carrier_id": carrier_id,
        "driver_id": token.get("driver_id"),
        "user_id": user_id,
    }


@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    user_id = token.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token payload")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"ok": True}
