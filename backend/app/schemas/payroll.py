from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PayeeResponse(BaseModel):
    id: int
    name: str
    payee_type: str

    class Config:
        from_attributes = True


class DriverDocumentResponse(BaseModel):
    id: int
    doc_type: str
    status: str
    issued_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    attachment_url: Optional[str] = None

    class Config:
        from_attributes = True


class DriverPayProfileResponse(BaseModel):
    id: int
    pay_type: str
    rate: float
    driver_kind: str
    active: bool

    class Config:
        from_attributes = True


class DriverAdditionalPayeeResponse(BaseModel):
    id: int
    pay_rate_percent: float
    payee: PayeeResponse
    active: bool

    class Config:
        from_attributes = True


class DriverDetailResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    payee: Optional[PayeeResponse] = None
    pay_profile: Optional[DriverPayProfileResponse] = None
    documents: list[DriverDocumentResponse] = []
    additional_payees: list[DriverAdditionalPayeeResponse] = []
    recurring_items: list["RecurringSettlementItemResponse"] = []

    class Config:
        from_attributes = True


class LedgerLineResponse(BaseModel):
    id: int
    category: str
    description: Optional[str] = None
    amount: float
    locked_at: Optional[datetime] = None
    settlement_id: Optional[int] = None

    class Config:
        from_attributes = True


class PayeeLedgerResponse(BaseModel):
    payee_id: int
    payee_name: str
    payee_type: str
    subtotal: float
    lines: list[LedgerLineResponse]


class LoadPayLedgerResponse(BaseModel):
    load_id: int
    currency: str = "USD"
    by_payee: list[PayeeLedgerResponse]
    load_pay_total: float


class SettlementCreateRequest(BaseModel):
    payee_id: int
    period_start: datetime
    period_end: datetime


class SettlementStatusResponse(BaseModel):
    id: int
    payee_id: int
    period_start: datetime
    period_end: datetime
    status: str
    paid_at: Optional[datetime] = None
    exported_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RecurringSettlementItemResponse(BaseModel):
    id: int
    item_type: str
    amount: float
    schedule: str
    next_date: Optional[datetime] = None
    active: bool
    description: Optional[str] = None

    class Config:
        from_attributes = True


DriverDetailResponse.model_rebuild()
