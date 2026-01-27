from __future__ import annotations

from datetime import datetime
from typing import Optional, Callable

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db

# Import the module (not specific names) so we can gracefully adapt
from app.core import security as sec

# Models (adjust import if your repo differs)
from app.models.models import User, TenantInvite, Tenant


router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------
# Pydantic request/response
# ---------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AcceptInviteRequest(BaseModel):
    token: str
    full_name: str
    password: str


# ---------------------------
# Helpers
# ---------------------------

def _user_to_dict(user: User) -> dict:
    return {
        "id": getattr(user, "id", None),
        "email": getattr(user, "email", None),
        "full_name": getattr(user, "full_name", None),
        "role": getattr(user, "role", None),
        "tenant_id": getattr(user, "tenant_id", None),
    }


def _utc_now_naive() -> datetime:
    """
    Your DB columns are 'timestamp without time zone' (naive).
    Compare with naive UTC now to avoid:
      TypeError: can't compare offset-naive and offset-aware datetimes
    """
    return datetime.utcnow()


def _get_hash_password_fn() -> Callable[[str], str]:
    """
    Try common hashing helpers in app.core.security without breaking imports.
    """
    # 1) get_password_hash(password)
    fn = getattr(sec, "get_password_hash", None)
    if callable(fn):
        return fn

    # 2) hash_password(password)
    fn = getattr(sec, "hash_password", None)
    if callable(fn):
        return fn

    # 3) pwd_context.hash(password)
    pwd_context = getattr(sec, "pwd_context", None)
    if pwd_context is not None and hasattr(pwd_context, "hash"):
        return pwd_context.hash  # type: ignore

    raise RuntimeError(
        "No password hashing function found. Expected one of: "
        "get_password_hash(), hash_password(), or sec.pwd_context.hash()."
    )


def _get_verify_password_fn() -> Callable[[str, str], bool]:
    fn = getattr(sec, "verify_password", None)
    if callable(fn):
        return fn

    # fallback: pwd_context.verify(plain, hash)
    pwd_context = getattr(sec, "pwd_context", None)
    if pwd_context is not None and hasattr(pwd_context, "verify"):
        return pwd_context.verify  # type: ignore

    raise RuntimeError(
        "No verify_password function found. Expected: verify_password() or sec.pwd_context.verify()."
    )


def _create_access_token(payload: dict) -> str:
    fn = getattr(sec, "create_access_token", None)
    if not callable(fn):
        raise RuntimeError("create_access_token() not found in app.core.security.")
    return fn(payload)


def _get_user_password_hash_field(user: User) -> str:
    """
    Your User model might use hashed_password or password_hash.
    """
    if hasattr(user, "hashed_password"):
        return user.hashed_password
    if hasattr(user, "password_hash"):
        return user.password_hash
    raise RuntimeError("User model has no hashed_password/password_hash field.")


def _set_user_password_hash_field(user: User, hashed: str) -> None:
    if hasattr(user, "hashed_password"):
        user.hashed_password = hashed
        return
    if hasattr(user, "password_hash"):
        user.password_hash = hashed
        return
    raise RuntimeError("User model has no hashed_password/password_hash field to set.")


# ---------------------------
# Routes
# ---------------------------

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    verify_password = _get_verify_password_fn()

    user: Optional[User] = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    stored_hash = _get_user_password_hash_field(user)
    if not verify_password(payload.password, stored_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = _create_access_token(
        {
            "sub": user.email,
            "user_id": user.id,
            "tenant_id": user.tenant_id,
            "role": user.role,
        }
    )

    return {"access_token": token, "token_type": "bearer", "user": _user_to_dict(user)}


@router.post("/invite/accept")
def accept_invite(payload: AcceptInviteRequest, db: Session = Depends(get_db)):
    """
    Accept invite token and create/attach user to tenant.

    Fixes:
    - Naive vs aware datetime comparisons
    - No import-time crashing code
    """
    hash_password = _get_hash_password_fn()

    invite: Optional[TenantInvite] = db.query(TenantInvite).filter(TenantInvite.token == payload.token).first()
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite token not found")

    if invite.accepted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite already accepted")

    now_utc = _utc_now_naive()
    if invite.expires_at and invite.expires_at < now_utc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite token expired")

    tenant: Optional[Tenant] = db.query(Tenant).filter(Tenant.id == invite.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found for invite")

    existing_user: Optional[User] = db.query(User).filter(User.email == invite.email).first()
    if existing_user:
        # Attach to tenant if not already attached
        if existing_user.tenant_id and existing_user.tenant_id != tenant.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already belongs to a different tenant",
            )

        if not existing_user.tenant_id:
            existing_user.tenant_id = tenant.id

        if not getattr(existing_user, "full_name", None):
            existing_user.full_name = payload.full_name

        invite.accepted = True
        db.add(existing_user)
        db.add(invite)
        db.commit()
        db.refresh(existing_user)

        token = _create_access_token(
            {
                "sub": existing_user.email,
                "user_id": existing_user.id,
                "tenant_id": existing_user.tenant_id,
                "role": existing_user.role,
            }
        )
        return {"access_token": token, "token_type": "bearer", "user": _user_to_dict(existing_user)}

    # Create new user (default role: tenant_admin)
    new_user = User(
        email=invite.email,
        full_name=payload.full_name,
        tenant_id=tenant.id,
        role="tenant_admin",
    )
    _set_user_password_hash_field(new_user, hash_password(payload.password))

    invite.accepted = True
    db.add(new_user)
    db.add(invite)
    db.commit()
    db.refresh(new_user)

    token = _create_access_token(
        {
            "sub": new_user.email,
            "user_id": new_user.id,
            "tenant_id": new_user.tenant_id,
            "role": new_user.role,
        }
    )

    return {"access_token": token, "token_type": "bearer", "user": _user_to_dict(new_user)}
