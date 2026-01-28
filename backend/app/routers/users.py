from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token, hash_password
from app.schemas.users import UserCreate, UserUpdate, UserResponse, UserPasswordReset
from app import models

router = APIRouter(prefix="/users", tags=["users"])


def _require_admin(token: dict) -> None:
    if token.get("role") not in {"admin", "dispatcher"}:
        raise HTTPException(status_code=403, detail="Access denied")


@router.get("", response_model=list[UserResponse])
def list_users(token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    _require_admin(token)
    carrier_id = token.get("carrier_id")
    return db.query(models.User).filter(models.User.carrier_id == carrier_id).all()


@router.post("", response_model=UserResponse)
def create_user(payload: UserCreate, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    _require_admin(token)
    carrier_id = token.get("carrier_id")
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already in use")
    user = models.User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        carrier_id=carrier_id,
        driver_id=payload.driver_id,
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, payload: UserUpdate, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    _require_admin(token)
    carrier_id = token.get("carrier_id")
    user = db.query(models.User).filter(models.User.id == user_id, models.User.carrier_id == carrier_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/reset-password")
def reset_password(user_id: int, payload: UserPasswordReset, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    _require_admin(token)
    carrier_id = token.get("carrier_id")
    user = db.query(models.User).filter(models.User.id == user_id, models.User.carrier_id == carrier_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"ok": True}
