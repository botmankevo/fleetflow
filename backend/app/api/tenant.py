from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import verify_token
from app.models.models import Tenant, User, Driver, Role, AuditLog
from app.schemas import DriverCreate, DriverUpdate, DriverResponse, UserResponse

router = APIRouter(prefix="/tenant", tags=["tenant"])


async def verify_tenant_scope(token: dict) -> int:
    """Verify token has tenant_id and return it."""
    if not token.get("tenant_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant scope required"
        )
    return token["tenant_id"]


async def verify_tenant_admin(
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
) -> tuple:
    """Verify user is tenant admin."""
    tenant_id = await verify_tenant_scope(token)
    
    if token.get("role") not in [Role.TENANT_ADMIN.value, Role.PLATFORM_OWNER.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant admin access required"
        )
    
    return (token, tenant_id)


@router.get("/profile")
async def get_tenant_profile(
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get tenant profile."""
    tenant_id = await verify_tenant_scope(token)
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    return {
        "id": tenant.id,
        "slug": tenant.slug,
        "name": tenant.name,
        "company_name": tenant.company_name,
        "mc_number": tenant.mc_number,
        "dot_number": tenant.dot_number,
        "email": tenant.email,
        "phone": tenant.phone,
        "address": tenant.address,
        "city": tenant.city,
        "state": tenant.state,
        "zip_code": tenant.zip_code
    }


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    auth: tuple = Depends(verify_tenant_admin),
    db: Session = Depends(get_db)
):
    """List tenant users."""
    token, tenant_id = auth
    
    users = db.query(User).filter(User.tenant_id == tenant_id).all()
    return [UserResponse.model_validate(u) for u in users]


@router.post("/drivers", response_model=DriverResponse)
async def create_driver(
    request: DriverCreate,
    auth: tuple = Depends(verify_tenant_admin),
    db: Session = Depends(get_db)
):
    """Create a driver."""
    token, tenant_id = auth
    
    driver = Driver(
        tenant_id=tenant_id,
        first_name=request.first_name,
        last_name=request.last_name,
        email=request.email,
        phone=request.phone,
        license_number=request.license_number,
        license_state=request.license_state,
        date_of_birth=request.date_of_birth,
        hire_date=request.hire_date,
        is_active=True
    )
    
    db.add(driver)
    db.commit()
    db.refresh(driver)
    
    # Log audit
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=token["user_id"],
        action="created",
        resource_type="driver",
        resource_id=driver.id,
        details={"name": f"{driver.first_name} {driver.last_name}"}
    )
    db.add(audit)
    db.commit()
    
    return DriverResponse.model_validate(driver)


@router.get("/drivers", response_model=List[DriverResponse])
async def list_drivers(
    auth: tuple = Depends(verify_tenant_admin),
    db: Session = Depends(get_db)
):
    """List tenant drivers."""
    token, tenant_id = auth
    
    drivers = db.query(Driver).filter(Driver.tenant_id == tenant_id).all()
    return [DriverResponse.model_validate(d) for d in drivers]


@router.get("/drivers/{driver_id}", response_model=DriverResponse)
async def get_driver(
    driver_id: int,
    auth: tuple = Depends(verify_tenant_admin),
    db: Session = Depends(get_db)
):
    """Get driver details."""
    token, tenant_id = auth
    
    driver = db.query(Driver).filter(
        Driver.id == driver_id,
        Driver.tenant_id == tenant_id
    ).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    
    return DriverResponse.model_validate(driver)


@router.put("/drivers/{driver_id}", response_model=DriverResponse)
async def update_driver(
    driver_id: int,
    request: DriverUpdate,
    auth: tuple = Depends(verify_tenant_admin),
    db: Session = Depends(get_db)
):
    """Update driver."""
    token, tenant_id = auth
    
    driver = db.query(Driver).filter(
        Driver.id == driver_id,
        Driver.tenant_id == tenant_id
    ).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    
    # Update fields
    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(driver, key, value)
    
    db.commit()
    db.refresh(driver)
    
    return DriverResponse.model_validate(driver)
