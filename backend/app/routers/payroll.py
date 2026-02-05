from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import verify_token
from app import models
from app.schemas.payroll import (
    PayeeResponse,
    DriverDetailResponse,
    SettlementCreateRequest,
    SettlementStatusResponse,
)

router = APIRouter(prefix="/payroll", tags=["payroll"])


@router.get("/payees", response_model=list[PayeeResponse])
def list_payees(token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    return db.query(models.Payee).filter(models.Payee.carrier_id == carrier_id).all()


@router.get("/payables-grouped")
def get_payables_grouped(token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """
    Get all unpaid/pending ledger lines grouped by payee.
    Returns summary for each payee with total amount owed and line count.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Query unpaid ledger lines grouped by payee
    grouped = (
        db.query(
            models.Payee.id,
            models.Payee.name,
            models.Payee.payee_type,
            func.sum(models.SettlementLedgerLine.amount).label("total_owed"),
            func.count(models.SettlementLedgerLine.id).label("line_count")
        )
        .join(models.SettlementLedgerLine, models.Payee.id == models.SettlementLedgerLine.payee_id)
        .filter(
            models.Payee.carrier_id == carrier_id,
            models.SettlementLedgerLine.settlement_id.is_(None),  # Not in a settlement
            models.SettlementLedgerLine.locked_at.is_(None),  # Not locked
            models.SettlementLedgerLine.voided_at.is_(None)  # Not voided
        )
        .group_by(models.Payee.id, models.Payee.name, models.Payee.payee_type)
        .all()
    )
    
    result = []
    for payee_id, name, payee_type, total_owed, line_count in grouped:
        result.append({
            "payee_id": payee_id,
            "payee_name": name,
            "payee_type": payee_type,
            "total_owed": float(total_owed or 0),
            "pending_line_count": line_count,
        })
    
    return result


@router.get("/payables-grouped/{payee_id}/lines")
def get_payee_ledger_lines(payee_id: int, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """
    Get all unpaid ledger lines for a specific payee with load details.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Verify payee belongs to carrier
    payee = db.query(models.Payee).filter(
        models.Payee.id == payee_id,
        models.Payee.carrier_id == carrier_id
    ).first()
    
    if not payee:
        raise HTTPException(status_code=404, detail="Payee not found")
    
    # Get unpaid lines
    lines = (
        db.query(models.SettlementLedgerLine)
        .filter(
            models.SettlementLedgerLine.payee_id == payee_id,
            models.SettlementLedgerLine.settlement_id.is_(None),
            models.SettlementLedgerLine.locked_at.is_(None),
            models.SettlementLedgerLine.voided_at.is_(None)
        )
        .all()
    )
    
    result = []
    for line in lines:
        load_info = None
        if line.load_id:
            load = db.query(models.Load).filter(models.Load.id == line.load_id).first()
            if load:
                load_info = {
                    "id": load.id,
                    "load_number": load.load_number,
                    "pickup_location": load.pickup_location,
                    "delivery_location": load.delivery_location,
                    "status": load.status,
                }
        
        result.append({
            "id": line.id,
            "load_id": line.load_id,
            "load_info": load_info,
            "category": line.category,
            "description": line.description,
            "amount": float(line.amount),
            "created_at": line.created_at.isoformat() if line.created_at else None,
        })
    
    return {
        "payee_id": payee.id,
        "payee_name": payee.name,
        "payee_type": payee.payee_type,
        "lines": result,
        "total": sum(float(line.amount) for line in lines)
    }


@router.get("/drivers/{driver_id}", response_model=DriverDetailResponse)
def get_driver_detail(driver_id: int, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    driver = (
        db.query(models.Driver)
        .filter(models.Driver.id == driver_id, models.Driver.carrier_id == carrier_id)
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


@router.post("/settlements", response_model=SettlementStatusResponse)
def create_settlement(
    payload: SettlementCreateRequest,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")

    payee = db.query(models.Payee).filter(models.Payee.id == payload.payee_id).first()
    if not payee:
        raise HTTPException(status_code=404, detail="Payee not found")

    settlement = models.PayrollSettlement(
        payee_id=payload.payee_id,
        period_start=payload.period_start,
        period_end=payload.period_end,
        status="draft",
    )
    db.add(settlement)
    db.commit()
    db.refresh(settlement)

    # Attach pending lines for payee
    pending_lines = (
        db.query(models.SettlementLedgerLine)
        .filter(
            models.SettlementLedgerLine.payee_id == payload.payee_id,
            models.SettlementLedgerLine.settlement_id.is_(None),
            models.SettlementLedgerLine.locked_at.is_(None),
        )
        .all()
    )
    for line in pending_lines:
        line.settlement_id = settlement.id
    db.commit()

    return settlement


@router.post("/settlements/{settlement_id}/approve", response_model=SettlementStatusResponse)
def approve_settlement(settlement_id: int, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    settlement = db.query(models.PayrollSettlement).filter(models.PayrollSettlement.id == settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    settlement.status = "approved"
    db.commit()
    db.refresh(settlement)
    return settlement


@router.post("/settlements/{settlement_id}/pay", response_model=SettlementStatusResponse)
def pay_settlement(settlement_id: int, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    settlement = db.query(models.PayrollSettlement).filter(models.PayrollSettlement.id == settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    settlement.status = "paid"
    settlement.paid_at = datetime.utcnow()

    lines = (
        db.query(models.SettlementLedgerLine)
        .filter(models.SettlementLedgerLine.settlement_id == settlement.id)
        .all()
    )
    for line in lines:
        line.locked_at = datetime.utcnow()
        line.locked_reason = "included_in_paid_settlement"
    db.commit()
    db.refresh(settlement)
    return settlement


@router.post("/settlements/{settlement_id}/export", response_model=SettlementStatusResponse)
def export_settlement(settlement_id: int, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    settlement = db.query(models.PayrollSettlement).filter(models.PayrollSettlement.id == settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    settlement.status = "exported"
    settlement.exported_at = datetime.utcnow()
    db.commit()
    db.refresh(settlement)
    return settlement
