from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class InviteAcceptRequest(BaseModel):
    token: str
    password: str
    full_name: str


# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    tenant_id: Optional[int]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Tenant Schemas
class TenantCreate(BaseModel):
    slug: str = Field(..., min_length=3, max_length=100)
    name: str
    company_name: str
    mc_number: Optional[str] = None
    dot_number: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    mc_number: Optional[str] = None
    dot_number: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None


class TenantResponse(BaseModel):
    id: int
    slug: str
    name: str
    company_name: str
    mc_number: Optional[str]
    dot_number: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Invite Schemas
class TenantInviteCreate(BaseModel):
    email: EmailStr


class TenantInviteResponse(BaseModel):
    id: int
    email: str
    created_at: datetime
    expires_at: datetime
    accepted: bool

    class Config:
        from_attributes = True


# Driver Schemas
class DriverCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    license_state: Optional[str] = None
    date_of_birth: Optional[str] = None
    hire_date: Optional[str] = None


class DriverUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    license_state: Optional[str] = None
    date_of_birth: Optional[str] = None
    hire_date: Optional[str] = None
    is_active: Optional[bool] = None


class DriverResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[str]
    phone: Optional[str]
    license_number: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Vehicle Schemas
class VehicleCreate(BaseModel):
    vehicle_number: str
    vin: Optional[str] = None
    license_plate: Optional[str] = None
    vehicle_type: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    purchase_date: Optional[str] = None
    current_odometer: Optional[float] = None


class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = None
    license_plate: Optional[str] = None
    current_odometer: Optional[float] = None
    is_active: Optional[bool] = None


class VehicleResponse(BaseModel):
    id: int
    vehicle_number: str
    vin: Optional[str]
    license_plate: Optional[str]
    vehicle_type: Optional[str]
    make: Optional[str]
    model: Optional[str]
    year: Optional[int]
    current_odometer: Optional[float]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Load Schemas
class LoadCreate(BaseModel):
    load_number: str
    pickup_location: str
    pickup_date: Optional[str] = None
    delivery_location: str
    delivery_date: Optional[str] = None
    broker_name: Optional[str] = None
    broker_phone: Optional[str] = None
    broker_email: Optional[str] = None
    notes: Optional[str] = None


class LoadUpdate(BaseModel):
    load_number: Optional[str] = None
    pickup_location: Optional[str] = None
    pickup_date: Optional[str] = None
    delivery_location: Optional[str] = None
    delivery_date: Optional[str] = None
    broker_name: Optional[str] = None
    broker_phone: Optional[str] = None
    broker_email: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class AssignDriverRequest(BaseModel):
    driver_id: int


class LoadResponse(BaseModel):
    id: int
    load_number: str
    status: str
    pickup_location: str
    pickup_date: Optional[str]
    delivery_location: str
    delivery_date: Optional[str]
    broker_name: Optional[str]
    driver_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# POD Schemas
class PODSubmitRequest(BaseModel):
    receiver_name: str
    receiver_signature: str  # SVG or base64
    delivery_date: str
    delivery_notes: Optional[str] = None


class PODFileResponse(BaseModel):
    id: int
    file_type: str
    filename: str
    dropbox_link: Optional[str]

    class Config:
        from_attributes = True


class PODResponse(BaseModel):
    id: int
    load_id: int
    status: str
    receiver_name: str
    delivery_date: str
    pdf_link: Optional[str]
    bol_folder_link: Optional[str]
    photos_zip_link: Optional[str]
    files: List[PODFileResponse]
    created_at: datetime

    class Config:
        from_attributes = True


# Compliance Schemas
class ComplianceDocCreate(BaseModel):
    doc_type: str
    expires_at: Optional[str] = None


class ComplianceDocResponse(BaseModel):
    id: int
    doc_type: str
    filename: str
    status: str
    expires_at: Optional[str]
    dropbox_link: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Maintenance Schemas
class MaintenanceLogCreate(BaseModel):
    work_description: str
    work_date: str
    odometer: Optional[float] = None
    cost: Optional[float] = None
    vendor: Optional[str] = None


class MaintenanceLogResponse(BaseModel):
    id: int
    work_description: str
    work_date: str
    odometer: Optional[float]
    cost: Optional[float]
    vendor: Optional[str]
    dropbox_link: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
