"""
Customer management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Load

router = APIRouter(prefix="/customers", tags=["customers"])


# Pydantic models
class CustomerContact(BaseModel):
    name: str
    title: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    is_primary: bool = False


class CustomerCreate(BaseModel):
    company_name: str
    mc_number: Optional[str] = None
    dot_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    payment_terms: Optional[str] = "Net 30"
    credit_limit: Optional[float] = None
    default_rate: Optional[float] = None
    notes: Optional[str] = None
    customer_type: str = "broker"  # broker, shipper, carrier


class CustomerUpdate(BaseModel):
    company_name: Optional[str] = None
    mc_number: Optional[str] = None
    dot_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[float] = None
    default_rate: Optional[float] = None
    notes: Optional[str] = None
    customer_type: Optional[str] = None
    is_active: Optional[bool] = None


class CustomerResponse(BaseModel):
    id: int
    company_name: str
    mc_number: Optional[str]
    dot_number: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    zip_code: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    payment_terms: Optional[str]
    credit_limit: Optional[float]
    default_rate: Optional[float]
    notes: Optional[str]
    customer_type: str
    is_active: bool
    total_loads: int
    total_revenue: float
    created_at: datetime


# Create Customer model (we'll add this to models.py)
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models import Customer


@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new customer"""
    carrier_id = current_user.carrier_id

    # Check for duplicate
    existing = db.query(Customer).filter(
        and_(
            Customer.carrier_id == carrier_id,
            Customer.company_name == customer.company_name
        )
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Customer with this name already exists")

    db_customer = Customer(
        carrier_id=carrier_id,
        **customer.dict()
    )

    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)

    return get_customer_with_stats(db, db_customer)


@router.get("/", response_model=List[CustomerResponse])
def list_customers(
    skip: int = 0,
    limit: int = 1000,  # Increased from 100 to 1000
    search: Optional[str] = None,
    customer_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all customers with filtering"""
    carrier_id = current_user.carrier_id

    query = db.query(Customer).filter(Customer.carrier_id == carrier_id)

    if search:
        query = query.filter(
            or_(
                Customer.company_name.ilike(f"%{search}%"),
                Customer.mc_number.ilike(f"%{search}%"),
                Customer.city.ilike(f"%{search}%")
            )
        )

    if customer_type:
        query = query.filter(Customer.customer_type == customer_type)

    if is_active is not None:
        query = query.filter(Customer.is_active == is_active)

    customers = query.order_by(Customer.company_name).offset(skip).limit(limit).all()

    return [get_customer_with_stats(db, c) for c in customers]


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get customer by ID"""
    carrier_id = current_user.carrier_id

    customer = db.query(Customer).filter(
        and_(
            Customer.id == customer_id,
            Customer.carrier_id == carrier_id
        )
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    return get_customer_with_stats(db, customer)


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update customer"""
    carrier_id = current_user.carrier_id

    customer = db.query(Customer).filter(
        and_(
            Customer.id == customer_id,
            Customer.carrier_id == carrier_id
        )
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Update fields
    for field, value in customer_update.dict(exclude_unset=True).items():
        setattr(customer, field, value)

    customer.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(customer)

    return get_customer_with_stats(db, customer)


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete customer (soft delete - mark as inactive)"""
    carrier_id = current_user.carrier_id

    customer = db.query(Customer).filter(
        and_(
            Customer.id == customer_id,
            Customer.carrier_id == carrier_id
        )
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Soft delete
    customer.is_active = False
    customer.updated_at = datetime.utcnow()

    db.commit()

    return {"success": True, "message": "Customer deactivated"}


@router.get("/{customer_id}/loads")
def get_customer_loads(
    customer_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all loads for a customer"""
    carrier_id = current_user.carrier_id

    customer = db.query(Customer).filter(
        and_(
            Customer.id == customer_id,
            Customer.carrier_id == carrier_id
        )
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Find loads by broker_name matching customer company_name
    loads = db.query(Load).filter(
        and_(
            Load.carrier_id == carrier_id,
            Load.broker_name == customer.company_name
        )
    ).order_by(Load.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": load.id,
            "load_number": load.load_number,
            "status": load.status,
            "pickup_address": load.pickup_address,
            "delivery_address": load.delivery_address,
            "rate_amount": load.rate_amount,
            "created_at": load.created_at.isoformat(),
        }
        for load in loads
    ]


@router.get("/{customer_id}/stats")
def get_customer_stats(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed stats for a customer"""
    carrier_id = current_user.carrier_id

    customer = db.query(Customer).filter(
        and_(
            Customer.id == customer_id,
            Customer.carrier_id == carrier_id
        )
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Get load stats
    loads = db.query(Load).filter(
        and_(
            Load.carrier_id == carrier_id,
            Load.broker_name == customer.company_name
        )
    ).all()

    total_loads = len(loads)
    total_revenue = sum([load.rate_amount or 0 for load in loads])
    avg_rate = total_revenue / total_loads if total_loads > 0 else 0

    # Status breakdown
    status_counts = {}
    for load in loads:
        status_counts[load.status] = status_counts.get(load.status, 0) + 1

    return {
        "customer_id": customer.id,
        "company_name": customer.company_name,
        "total_loads": total_loads,
        "total_revenue": total_revenue,
        "average_rate": round(avg_rate, 2),
        "status_breakdown": status_counts,
        "payment_terms": customer.payment_terms,
        "credit_limit": customer.credit_limit,
    }


def get_customer_with_stats(db: Session, customer: Customer) -> dict:
    """Helper to get customer with load stats"""
    # Get load count and revenue
    loads = db.query(Load).filter(
        and_(
            Load.carrier_id == customer.carrier_id,
            Load.broker_name == customer.company_name
        )
    ).all()

    total_loads = len(loads)
    total_revenue = sum([load.rate_amount or 0 for load in loads])

    return {
        "id": customer.id,
        "company_name": customer.company_name,
        "mc_number": customer.mc_number,
        "dot_number": customer.dot_number,
        "address": customer.address,
        "city": customer.city,
        "state": customer.state,
        "zip_code": customer.zip_code,
        "phone": customer.phone,
        "email": customer.email,
        "payment_terms": customer.payment_terms,
        "credit_limit": customer.credit_limit,
        "default_rate": customer.default_rate,
        "notes": customer.notes,
        "customer_type": customer.customer_type,
        "is_active": customer.is_active,
        "total_loads": total_loads,
        "total_revenue": total_revenue,
        "created_at": customer.created_at,
    }
