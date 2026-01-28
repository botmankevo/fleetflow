from pydantic import BaseModel
from typing import Optional


class DriverBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class DriverResponse(DriverBase):
    id: int
    carrier_id: int

    class Config:
        from_attributes = True
