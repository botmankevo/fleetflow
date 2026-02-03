from pydantic import BaseModel
from typing import Optional

from app.schemas.payroll import PayeeResponse, DriverPayProfileResponse, DriverAdditionalPayeeResponse, DriverDocumentResponse


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
    payee: Optional[PayeeResponse] = None
    pay_profile: Optional[DriverPayProfileResponse] = None
    documents: list[DriverDocumentResponse] = []
    additional_payees: list[DriverAdditionalPayeeResponse] = []

    class Config:
        from_attributes = True
