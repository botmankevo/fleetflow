from pydantic import BaseModel
from typing import Optional


class LoadBase(BaseModel):
    load_number: str
    status: str = "Created"
    pickup_address: str
    delivery_address: str
    notes: Optional[str] = None
    driver_id: Optional[int] = None


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

    class Config:
        from_attributes = True
