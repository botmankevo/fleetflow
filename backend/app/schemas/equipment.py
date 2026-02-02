from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EquipmentBase(BaseModel):
    equipment_type: str
    identifier: str
    status: str = "available"
    assigned_load_id: Optional[int] = None

class EquipmentCreate(EquipmentBase):
    pass

class Equipment(EquipmentBase):
    id: int
    carrier_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
