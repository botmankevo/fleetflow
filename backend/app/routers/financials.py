from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import verify_token
from app import models
from pydantic import BaseModel

router = APIRouter(prefix="/financials", tags=["financials"])

class FinancialSettingsUpdate(BaseModel):
    target_profit_rpm: Optional[float] = None
    warning_rpm: Optional[float] = None
    break_even_rpm: Optional[float] = None
    fuel_cost_per_gallon: Optional[float] = None
    avg_mpg: Optional[float] = None
    monthly_insurance: Optional[float] = None
    monthly_truck_payment: Optional[float] = None
    monthly_permits: Optional[float] = None
    monthly_other_fixed: Optional[float] = None

@router.get("/settings")
def get_financial_settings(db: Session = Depends(get_db), token: dict = Depends(verify_token)):
    carrier_id = token.get("carrier_id")
    settings = db.query(models.FinancialSettings).filter(models.FinancialSettings.carrier_id == carrier_id).first()
    if not settings:
        settings = models.FinancialSettings(carrier_id=carrier_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.patch("/settings")
def update_financial_settings(payload: FinancialSettingsUpdate, db: Session = Depends(get_db), token: dict = Depends(verify_token)):
    carrier_id = token.get("carrier_id")
    settings = db.query(models.FinancialSettings).filter(models.FinancialSettings.carrier_id == carrier_id).first()
    if not settings:
        settings = models.FinancialSettings(carrier_id=carrier_id)
        db.add(settings)
    
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    return settings

@router.get("/break-even")
def calculate_break_even(db: Session = Depends(get_db), token: dict = Depends(verify_token)):
    carrier_id = token.get("carrier_id")
    settings = db.query(models.FinancialSettings).filter(models.FinancialSettings.carrier_id == carrier_id).first()
    if not settings:
        return {"break_even_rpm": 1.18}
    
    # Simple break-even calculation:
    # Fixed monthly costs / average miles per month + Variable costs (fuel)
    # This is a baseline if the user hasn't provided enough data.
    return {
        "break_even_rpm": settings.break_even_rpm,
        "warning_rpm": settings.warning_rpm,
        "target_profit_rpm": settings.target_profit_rpm
    }
