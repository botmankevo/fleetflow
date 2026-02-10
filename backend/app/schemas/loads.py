from pydantic import BaseModel, field_serializer
from typing import Optional
from datetime import datetime


class DriverSimple(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True


class CustomerSimple(BaseModel):
    id: int
    company_name: str
    customer_type: Optional[str] = None
    
    class Config:
        from_attributes = True


class LoadBase(BaseModel):
    load_number: str
    status: str = "Created"
    pickup_address: str
    delivery_address: str
    notes: Optional[str] = None
    driver_id: Optional[int] = None
    broker_name: Optional[str] = None
    po_number: Optional[str] = None
    rate_amount: Optional[float] = None


class LoadCreate(LoadBase):
    pass


class LoadUpdate(BaseModel):
    load_number: Optional[str] = None
    status: Optional[str] = None
    pickup_address: Optional[str] = None
    delivery_address: Optional[str] = None
    notes: Optional[str] = None
    driver_id: Optional[int] = None


class LoadResponse(LoadBase):
    id: int
    carrier_id: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    # Relationships
    driver: Optional[DriverSimple] = None
    customer: Optional[CustomerSimple] = None
    
    # Add fields for frontend compatibility (will be computed from ORM)
    broker_rate: Optional[float] = None
    pickup_location: Optional[str] = None
    pickup_city: Optional[str] = None
    pickup_state: Optional[str] = None
    pickup_date: Optional[str] = None
    delivery_location: Optional[str] = None
    delivery_city: Optional[str] = None
    delivery_state: Optional[str] = None
    delivery_date: Optional[str] = None
    
    # Document attachments
    rc_document: Optional[str] = None
    bol_document: Optional[str] = None
    pod_document: Optional[str] = None
    invoice_document: Optional[str] = None
    receipt_document: Optional[str] = None
    other_document: Optional[str] = None

    class Config:
        from_attributes = True
