from pydantic import BaseModel, field_serializer
from typing import Optional, List
from datetime import datetime


class DriverPayProfileSimple(BaseModel):
    pay_type: str
    rate: float
    driver_kind: str
    
    class Config:
        from_attributes = True


class DriverSimple(BaseModel):
    id: int
    name: str
    pay_profile: Optional[DriverPayProfileSimple] = None
    
    class Config:
        from_attributes = True


class CustomerSimple(BaseModel):
    id: int
    company_name: str
    customer_type: Optional[str] = None
    
    class Config:
        from_attributes = True


class LoadStopBase(BaseModel):
    stop_type: str
    stop_number: int = 1
    company: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    hours: Optional[str] = None
    miles_to_next_stop: Optional[float] = None


class LoadStopCreate(LoadStopBase):
    pass


class LoadStopResponse(LoadStopBase):
    id: int
    load_id: int
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class LoadBase(BaseModel):
    load_number: str
    status: str = "Created"
    pickup_address: str
    delivery_address: str
    notes: Optional[str] = None
    driver_id: Optional[int] = None
    truck_id: Optional[int] = None
    trailer_id: Optional[int] = None
    broker_name: Optional[str] = None
    po_number: Optional[str] = None
    load_type: str = "Full"
    weight: Optional[float] = None
    pallets: Optional[int] = None
    length_ft: Optional[float] = None
    rate_amount: Optional[float] = None
    fuel_surcharge: Optional[float] = 0.0
    detention: Optional[float] = 0.0
    layover: Optional[float] = 0.0
    lumper: Optional[float] = 0.0
    other_fees: Optional[float] = 0.0
    total_miles: Optional[float] = None
    rate_per_mile: Optional[float] = None
    rc_document: Optional[str] = None
    bol_document: Optional[str] = None
    pod_document: Optional[str] = None
    invoice_document: Optional[str] = None
    receipt_document: Optional[str] = None
    other_document: Optional[str] = None
    stops: Optional[List[LoadStopCreate]] = None
    customer_id: Optional[int] = None


class LoadCreate(LoadBase):
    pass


class LoadUpdate(BaseModel):
    load_number: Optional[str] = None
    status: Optional[str] = None
    pickup_address: Optional[str] = None
    delivery_address: Optional[str] = None
    notes: Optional[str] = None
    driver_id: Optional[int] = None
    truck_id: Optional[int] = None
    trailer_id: Optional[int] = None
    load_type: Optional[str] = None
    weight: Optional[float] = None
    pallets: Optional[int] = None
    length_ft: Optional[float] = None
    rate_amount: Optional[float] = None
    fuel_surcharge: Optional[float] = None
    detention: Optional[float] = None
    layover: Optional[float] = None
    lumper: Optional[float] = None
    other_fees: Optional[float] = None
    total_miles: Optional[float] = None
    rate_per_mile: Optional[float] = None
    broker_name: Optional[str] = None
    po_number: Optional[str] = None
    customer_id: Optional[int] = None
    rc_document: Optional[str] = None
    bol_document: Optional[str] = None
    pod_document: Optional[str] = None
    invoice_document: Optional[str] = None
    receipt_document: Optional[str] = None
    other_document: Optional[str] = None
    stops: Optional[List[LoadStopCreate]] = None


class LoadResponse(LoadBase):
    id: int
    carrier_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    total_miles: Optional[float] = None
    rate_per_mile: Optional[float] = None
    
    # Relationships
    driver: Optional[DriverSimple] = None
    customer: Optional[CustomerSimple] = None
    
    # Add fields for frontend compatibility (will be computed from ORM)
    broker_rate: Optional[float] = None
    pickup_location: Optional[str] = None
    pickup_city: Optional[str] = None
    pickup_state: Optional[str] = None
    pickup_date: Optional[datetime] = None
    delivery_location: Optional[str] = None
    delivery_city: Optional[str] = None
    delivery_state: Optional[str] = None
    delivery_date: Optional[datetime] = None
    
    # Document attachments
    rc_document: Optional[str] = None
    bol_document: Optional[str] = None
    pod_document: Optional[str] = None
    invoice_document: Optional[str] = None
    receipt_document: Optional[str] = None
    other_document: Optional[str] = None
    
    # Overwrite stops with response version
    stops: Optional[List[LoadStopResponse]] = None

    class Config:
        from_attributes = True
