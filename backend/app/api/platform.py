from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.core.security import verify_token, hash_password
from app.models.models import Tenant, User, TenantInvite, Role, AuditLog
from app.schemas import TenantCreate, TenantUpdate, TenantResponse, TenantInviteCreate, TenantInviteResponse, UserResponse
from app.services.email_service import EmailService
import secrets

router = APIRouter(prefix="/platform", tags=["platform"])


def _is_platform_owner(token: dict) -> bool:
    """Check if user is platform owner."""
    return token.get("role") == Role.PLATFORM_OWNER.value


async def verify_platform_owner(token: dict = Depends(verify_token)) -> dict:
    """Verify that user is platform owner."""
    if not _is_platform_owner(token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only platform owners can perform this action"
        )
    return token


@router.get("/tenants", tags=["platform"])
async def list_tenants(
    token: dict = Depends(verify_platform_owner),
    db: Session = Depends(get_db)
):
    """List all tenants (platform owner only)."""
    tenants = db.query(Tenant).filter(Tenant.is_active == True).all()
    return [TenantResponse.model_validate(t) for t in tenants]


@router.post("/tenants", response_model=TenantResponse)
async def create_tenant(
    request: TenantCreate,
    token: dict = Depends(verify_platform_owner),
    db: Session = Depends(get_db)
):
    """Create a new tenant (platform owner only)."""
    # Check if slug already exists
    existing = db.query(Tenant).filter(Tenant.slug == request.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug already exists"
        )
    
    tenant = Tenant(
        slug=request.slug,
        name=request.name,
        company_name=request.company_name or request.name,
        mc_number=request.mc_number,
        dot_number=request.dot_number,
        email=request.email,
        phone=request.phone,
        address=request.address,
        city=request.city,
        state=request.state,
        zip_code=request.zip_code,
        is_active=True
    )
    
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    
    # Log audit
    audit = AuditLog(
        user_id=token["user_id"],
        action="created",
        resource_type="tenant",
        resource_id=tenant.id,
        details={"slug": tenant.slug, "name": tenant.name}
    )
    db.add(audit)
    db.commit()
    
    return TenantResponse.model_validate(tenant)


@router.get("/tenants/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: int,
    token: dict = Depends(verify_platform_owner),
    db: Session = Depends(get_db)
):
    """Get tenant details (platform owner only)."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    return TenantResponse.model_validate(tenant)


@router.post("/tenants/{tenant_id}/invites", response_model=TenantInviteResponse)
async def invite_tenant_admin(
    tenant_id: int,
    request: TenantInviteCreate,
    token: dict = Depends(verify_platform_owner),
    db: Session = Depends(get_db)
):
    """Send invite to new tenant admin (platform owner only)."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    # Create invite
    token_str = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    invite = TenantInvite(
        tenant_id=tenant_id,
        email=request.email,
        token=token_str,
        expires_at=expires_at,
        accepted=False
    )
    
    db.add(invite)
    db.commit()
    db.refresh(invite)
    
    # Send email
    invite_url = f"{tenant.slug}.fleetflow.app/accept-invite?token={token_str}"
    EmailService.send_email(
        request.email,
        f"Invitation to join {tenant.name} on FleetFlow",
        f"<p>You have been invited to join {tenant.name}.</p>"
        f"<p><a href='{invite_url}'>Accept Invite</a></p>"
    )
    
    # Log audit
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=token["user_id"],
        action="invited",
        resource_type="user",
        details={"email": request.email}
    )
    db.add(audit)
    db.commit()
    
    return TenantInviteResponse.model_validate(invite)
