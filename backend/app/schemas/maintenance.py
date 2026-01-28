from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MaintenanceBase(BaseModel):
    unit: Optional[str] = None
    description: Optional[str] = None
    cost: int = 0
    occurred_at: Optional[datetime] = None
    receipt_link: Optional[str] = None


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    unit: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[int] = None
    occurred_at: Optional[datetime] = None
    receipt_link: Optional[str] = None


class MaintenanceResponse(MaintenanceBase):
    id: int
    carrier_id: int

    class Config:
        from_attributes = True
