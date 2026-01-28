from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ExpenseBase(BaseModel):
    amount: int = 0
    category: Optional[str] = None
    description: Optional[str] = None
    occurred_at: Optional[datetime] = None
    receipt_link: Optional[str] = None
    driver_id: Optional[int] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    amount: Optional[int] = None
    category: Optional[str] = None
    description: Optional[str] = None
    occurred_at: Optional[datetime] = None
    receipt_link: Optional[str] = None
    driver_id: Optional[int] = None


class ExpenseResponse(ExpenseBase):
    id: int
    carrier_id: int

    class Config:
        from_attributes = True
