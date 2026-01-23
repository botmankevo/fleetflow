from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token, verify_token
)
from app.models.models import User, TenantInvite, Tenant, Role
from app.schemas import LoginRequest, LoginResponse, InviteAcceptRequest, UserResponse
import secrets

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    # Create token
    access_token = create_access_token({
        "sub": user.email,
        "user_id": user.id,
        "tenant_id": user.tenant_id,
        "role": user.role
    })
    
    return LoginResponse(
        access_token=access_token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "tenant_id": user.tenant_id
        }
    )


@router.post("/invite/accept")
async def accept_invite(request: InviteAcceptRequest, db: Session = Depends(get_db)):
    """Accept tenant invite and create user account."""
    invite = db.query(TenantInvite).filter(
        TenantInvite.token == request.token
    ).first()
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found"
        )
    
    if invite.accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite already accepted"
        )
    
    if invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite expired"
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == invite.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    # Create user
    user = User(
        email=invite.email,
        full_name=request.full_name,
        hashed_password=hash_password(request.password),
        role=Role.TENANT_ADMIN.value,
        tenant_id=invite.tenant_id,
        is_active=True
    )
    
    db.add(user)
    invite.accepted = True
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Account created successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "tenant_id": user.tenant_id
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get current authenticated user."""
    user = db.query(User).filter(User.id == token["user_id"]).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user
