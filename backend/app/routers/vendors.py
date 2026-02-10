"""
Vendor Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Vendor

router = APIRouter(prefix="/vendors", tags=["vendors"])


@router.get("/")
def get_vendors(
    vendor_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    preferred: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all vendors with optional filtering"""
    query = db.query(Vendor).filter(Vendor.carrier_id == current_user.carrier_id)
    
    if vendor_type:
        query = query.filter(Vendor.vendor_type == vendor_type)
    if is_active is not None:
        query = query.filter(Vendor.is_active == is_active)
    if preferred is not None:
        query = query.filter(Vendor.preferred == preferred)
    
    vendors = query.order_by(Vendor.name).offset(skip).limit(limit).all()
    return vendors


@router.get("/{vendor_id}")
def get_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific vendor by ID"""
    vendor = db.query(Vendor).filter(
        Vendor.id == vendor_id,
        Vendor.carrier_id == current_user.carrier_id
    ).first()
    
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return vendor


@router.post("/")
def create_vendor(
    name: str,
    vendor_type: str,
    contact_name: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    address: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    zip_code: Optional[str] = None,
    tax_id: Optional[str] = None,
    payment_terms: Optional[str] = None,
    account_number: Optional[str] = None,
    website: Optional[str] = None,
    notes: Optional[str] = None,
    preferred: bool = False,
    rating: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new vendor"""
    vendor = Vendor(
        carrier_id=current_user.carrier_id,
        name=name,
        vendor_type=vendor_type,
        contact_name=contact_name,
        email=email,
        phone=phone,
        address=address,
        city=city,
        state=state,
        zip_code=zip_code,
        tax_id=tax_id,
        payment_terms=payment_terms,
        account_number=account_number,
        website=website,
        notes=notes,
        is_active=True,
        preferred=preferred,
        rating=rating
    )
    
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.put("/{vendor_id}")
def update_vendor(
    vendor_id: int,
    name: Optional[str] = None,
    vendor_type: Optional[str] = None,
    contact_name: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    address: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    zip_code: Optional[str] = None,
    tax_id: Optional[str] = None,
    payment_terms: Optional[str] = None,
    account_number: Optional[str] = None,
    website: Optional[str] = None,
    notes: Optional[str] = None,
    is_active: Optional[bool] = None,
    preferred: Optional[bool] = None,
    rating: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a vendor"""
    vendor = db.query(Vendor).filter(
        Vendor.id == vendor_id,
        Vendor.carrier_id == current_user.carrier_id
    ).first()
    
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    if name is not None:
        vendor.name = name
    if vendor_type is not None:
        vendor.vendor_type = vendor_type
    if contact_name is not None:
        vendor.contact_name = contact_name
    if email is not None:
        vendor.email = email
    if phone is not None:
        vendor.phone = phone
    if address is not None:
        vendor.address = address
    if city is not None:
        vendor.city = city
    if state is not None:
        vendor.state = state
    if zip_code is not None:
        vendor.zip_code = zip_code
    if tax_id is not None:
        vendor.tax_id = tax_id
    if payment_terms is not None:
        vendor.payment_terms = payment_terms
    if account_number is not None:
        vendor.account_number = account_number
    if website is not None:
        vendor.website = website
    if notes is not None:
        vendor.notes = notes
    if is_active is not None:
        vendor.is_active = is_active
    if preferred is not None:
        vendor.preferred = preferred
    if rating is not None:
        vendor.rating = rating
    
    from datetime import datetime
    vendor.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(vendor)
    return vendor


@router.delete("/{vendor_id}")
def delete_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a vendor"""
    vendor = db.query(Vendor).filter(
        Vendor.id == vendor_id,
        Vendor.carrier_id == current_user.carrier_id
    ).first()
    
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    db.delete(vendor)
    db.commit()
    return {"message": "Vendor deleted successfully"}


@router.get("/types/list")
def get_vendor_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of vendor types"""
    return {
        "vendor_types": [
            "repair_shop",
            "fuel_station",
            "tire_shop",
            "permit_service",
            "insurance",
            "towing",
            "parts_supplier",
            "wash_service",
            "scales",
            "other"
        ]
    }


@router.get("/stats/summary")
def get_vendor_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get vendor statistics"""
    total_vendors = db.query(Vendor).filter(
        Vendor.carrier_id == current_user.carrier_id
    ).count()
    
    active_vendors = db.query(Vendor).filter(
        Vendor.carrier_id == current_user.carrier_id,
        Vendor.is_active == True
    ).count()
    
    preferred_vendors = db.query(Vendor).filter(
        Vendor.carrier_id == current_user.carrier_id,
        Vendor.preferred == True
    ).count()
    
    # Count by type
    from sqlalchemy import func
    by_type = db.query(
        Vendor.vendor_type,
        func.count(Vendor.id).label('count')
    ).filter(
        Vendor.carrier_id == current_user.carrier_id
    ).group_by(Vendor.vendor_type).all()
    
    return {
        "total_vendors": total_vendors,
        "active_vendors": active_vendors,
        "preferred_vendors": preferred_vendors,
        "by_type": {item.vendor_type: item.count for item in by_type}
    }
