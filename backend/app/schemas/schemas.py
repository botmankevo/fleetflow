from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LoadBase(BaseModel):
    load_id: str
    commodity: Optional[str] = None
    broker_info_text: Optional[str] = None
    pickup_name: str
    pickup_address: str
    delivery_name: str
    delivery_address: str
    delivery_date: Optional[str] = None
    status: Optional[str] = None
    assigned_driver_id: Optional[int] = None


class LoadCreate(LoadBase):
    pass


class LoadOut(LoadBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PodSubmissionBase(BaseModel):
    receiver_name: str
    receiver_signature_typed: str
    delivery_notes: Optional[str] = None


class PodSubmissionCreate(PodSubmissionBase):
    load_id: int


class PodSubmissionOut(PodSubmissionBase):
    id: int
    load_id: int
    driver_id: int
    submitted_at: datetime
    dropbox_signed_bol_paths: List[str] = []
    dropbox_delivery_photo_paths: List[str] = []
    dropbox_zip_path: Optional[str] = None
    dropbox_zip_shared_link: Optional[str] = None
    dropbox_pod_packet_pdf_path: Optional[str] = None
    dropbox_pod_packet_shared_link: Optional[str] = None

    class Config:
        from_attributes = True


class MaintenanceCreate(BaseModel):
    vehicle_id: str
    type: str
    description: Optional[str] = None
    cost: Optional[str] = None
    date: Optional[str] = None


class ExpenseCreate(BaseModel):
    category: str
    description: Optional[str] = None
    cost: Optional[str] = None
    date: Optional[str] = None


class AuditLogOut(BaseModel):
    id: int
    actor_user_id: int
    action: str
    entity_type: str
    entity_id: str
    metadata: dict
    created_at: datetime

    class Config:
        from_attributes = True
