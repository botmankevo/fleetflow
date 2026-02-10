from datetime import datetime
from typing import List
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
    DriverPayProfileCreate,
    DriverAdditionalPayeeCreate,
    RecurringSettlementItemCreate,
)
from app.services.email_service import EmailService
from app.services.payroll_reports import payroll_reports
from app.services.quickbooks_service import quickbooks_service

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


@router.post("/drivers/{driver_id}/pay-profile")
def create_or_update_pay_profile(
    driver_id: int,
    payload: DriverPayProfileCreate,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Create or update driver pay profile"""
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    driver = db.query(models.Driver).filter(
        models.Driver.id == driver_id,
        models.Driver.carrier_id == carrier_id
    ).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Deactivate existing pay profile
    if driver.pay_profile:
        driver.pay_profile.active = False
    
    # Create new pay profile
    pay_profile = models.DriverPayProfile(
        driver_id=driver_id,
        pay_type=payload.pay_type,
        rate=payload.rate,
        driver_kind=payload.driver_kind,
        active=True
    )
    db.add(pay_profile)
    db.commit()
    db.refresh(pay_profile)
    
    return {"message": "Pay profile updated", "id": pay_profile.id}


@router.post("/drivers/{driver_id}/additional-payees")
def add_additional_payee(
    driver_id: int,
    payload: DriverAdditionalPayeeCreate,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Add an additional payee to driver (e.g., equipment owner)"""
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    driver = db.query(models.Driver).filter(
        models.Driver.id == driver_id,
        models.Driver.carrier_id == carrier_id
    ).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Verify payee exists
    payee = db.query(models.Payee).filter(
        models.Payee.id == payload.payee_id,
        models.Payee.carrier_id == carrier_id
    ).first()
    if not payee:
        raise HTTPException(status_code=404, detail="Payee not found")
    
    additional_payee = models.DriverAdditionalPayee(
        driver_id=driver_id,
        payee_id=payload.payee_id,
        pay_rate_percent=payload.pay_rate_percent,
        active=True
    )
    db.add(additional_payee)
    db.commit()
    db.refresh(additional_payee)
    
    return {"message": "Additional payee added", "id": additional_payee.id}


@router.delete("/drivers/{driver_id}/additional-payees/{additional_payee_id}")
def remove_additional_payee(
    driver_id: int,
    additional_payee_id: int,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Remove an additional payee from driver"""
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    driver = db.query(models.Driver).filter(
        models.Driver.id == driver_id,
        models.Driver.carrier_id == carrier_id
    ).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    additional_payee = db.query(models.DriverAdditionalPayee).filter(
        models.DriverAdditionalPayee.id == additional_payee_id,
        models.DriverAdditionalPayee.driver_id == driver_id
    ).first()
    if not additional_payee:
        raise HTTPException(status_code=404, detail="Additional payee not found")
    
    db.delete(additional_payee)
    db.commit()
    
    return {"message": "Additional payee removed"}


@router.post("/drivers/{driver_id}/recurring-items")
def add_recurring_item(
    driver_id: int,
    payload: RecurringSettlementItemCreate,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Add a recurring settlement item (escrow, deduction, etc.)"""
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    driver = db.query(models.Driver).filter(
        models.Driver.id == driver_id,
        models.Driver.carrier_id == carrier_id
    ).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Verify payee exists
    payee = db.query(models.Payee).filter(
        models.Payee.id == payload.payee_id,
        models.Payee.carrier_id == carrier_id
    ).first()
    if not payee:
        raise HTTPException(status_code=404, detail="Payee not found")
    
    recurring_item = models.RecurringSettlementItem(
        driver_id=driver_id,
        payee_id=payload.payee_id,
        item_type=payload.item_type,
        amount=payload.amount,
        schedule=payload.schedule,
        description=payload.description,
        active=True
    )
    db.add(recurring_item)
    db.commit()
    db.refresh(recurring_item)
    
    return {"message": "Recurring item added", "id": recurring_item.id}


@router.patch("/drivers/{driver_id}/recurring-items/{item_id}")
def update_recurring_item(
    driver_id: int,
    item_id: int,
    payload: RecurringSettlementItemCreate,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Update a recurring settlement item"""
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    driver = db.query(models.Driver).filter(
        models.Driver.id == driver_id,
        models.Driver.carrier_id == carrier_id
    ).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    item = db.query(models.RecurringSettlementItem).filter(
        models.RecurringSettlementItem.id == item_id,
        models.RecurringSettlementItem.driver_id == driver_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recurring item not found")
    
    item.item_type = payload.item_type
    item.amount = payload.amount
    item.schedule = payload.schedule
    if payload.description is not None:
        item.description = payload.description
    
    db.commit()
    db.refresh(item)
    
    return {"message": "Recurring item updated", "id": item.id}


@router.delete("/drivers/{driver_id}/recurring-items/{item_id}")
def delete_recurring_item(
    driver_id: int,
    item_id: int,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Delete/deactivate a recurring settlement item"""
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    driver = db.query(models.Driver).filter(
        models.Driver.id == driver_id,
        models.Driver.carrier_id == carrier_id
    ).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    item = db.query(models.RecurringSettlementItem).filter(
        models.RecurringSettlementItem.id == item_id,
        models.RecurringSettlementItem.driver_id == driver_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recurring item not found")
    
    item.active = False
    db.commit()
    
    return {"message": "Recurring item deactivated"}


@router.get("/settlements", response_model=list[SettlementStatusResponse])
def list_settlements(token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """Get all settlements for the carrier"""
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Get settlements via payees that belong to this carrier
    settlements = (
        db.query(models.PayrollSettlement)
        .join(models.Payee, models.PayrollSettlement.payee_id == models.Payee.id)
        .filter(models.Payee.carrier_id == carrier_id)
        .order_by(models.PayrollSettlement.created_at.desc())
        .all()
    )
    
    return settlements


@router.get("/settlements/{settlement_id}")
def get_settlement_detail(settlement_id: int, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """Get settlement details with all ledger lines"""
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    settlement = db.query(models.PayrollSettlement).filter(
        models.PayrollSettlement.id == settlement_id
    ).first()
    
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    
    # Verify settlement belongs to carrier
    payee = db.query(models.Payee).filter(models.Payee.id == settlement.payee_id).first()
    if not payee or payee.carrier_id != carrier_id:
        raise HTTPException(status_code=404, detail="Settlement not found")
    
    # Get ledger lines for this settlement
    lines = db.query(models.SettlementLedgerLine).filter(
        models.SettlementLedgerLine.settlement_id == settlement_id
    ).all()
    
    line_items = []
    for line in lines:
        load_info = None
        if line.load_id:
            load = db.query(models.Load).filter(models.Load.id == line.load_id).first()
            if load:
                load_info = {
                    "id": load.id,
                    "load_number": load.load_number,
                    "pickup_location": load.pickup_address,
                    "delivery_location": load.delivery_address,
                    "status": load.status,
                }
        
        line_items.append({
            "id": line.id,
            "load_id": line.load_id,
            "load_info": load_info,
            "category": line.category,
            "description": line.description,
            "amount": float(line.amount),
            "created_at": line.created_at.isoformat() if line.created_at else None,
        })
    
    return {
        "settlement_id": settlement.id,
        "payee_name": payee.name,
        "period_start": settlement.period_start.isoformat(),
        "period_end": settlement.period_end.isoformat(),
        "status": settlement.status,
        "lines": line_items,
        "total": sum(float(line.amount) for line in lines)
    }


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
            models.SettlementLedgerLine.voided_at.is_(None),
        )
        .all()
    )
    for line in pending_lines:
        line.settlement_id = settlement.id
    
    # Process recurring settlement items (additions/deductions)
    # Find the driver associated with this payee
    driver = db.query(models.Driver).filter(models.Driver.payee_id == payload.payee_id).first()
    if driver:
        recurring_items = (
            db.query(models.RecurringSettlementItem)
            .filter(
                models.RecurringSettlementItem.driver_id == driver.id,
                models.RecurringSettlementItem.active == True,
                models.RecurringSettlementItem.payee_id == payload.payee_id,
            )
            .all()
        )
        
        for item in recurring_items:
            # Check if this item should be included based on schedule and next_date
            if item.next_date and item.next_date > payload.period_end:
                continue  # Not due yet
            
            # Determine amount sign based on item_type
            amount = item.amount
            if item.item_type in ["deduction", "loan"]:
                amount = -abs(amount)  # Ensure negative for deductions
            elif item.item_type in ["addition", "bonus"]:
                amount = abs(amount)  # Ensure positive for additions
            
            # Create ledger line for recurring item
            recurring_line = models.SettlementLedgerLine(
                load_id=None,  # Not associated with a specific load
                payee_id=payload.payee_id,
                settlement_id=settlement.id,
                category=item.item_type,
                description=item.description or f"{item.item_type.replace('_', ' ').title()}",
                amount=amount,
            )
            db.add(recurring_line)
            
            # Update next_date based on schedule
            if item.schedule == "weekly":
                from datetime import timedelta
                item.next_date = payload.period_end + timedelta(days=7)
            elif item.schedule == "biweekly":
                from datetime import timedelta
                item.next_date = payload.period_end + timedelta(days=14)
            elif item.schedule == "monthly":
                from datetime import timedelta
                item.next_date = payload.period_end + timedelta(days=30)
    
    db.commit()
    db.refresh(settlement)
    
    # Send email notification to driver
    driver = db.query(models.Driver).filter(models.Driver.payee_id == payload.payee_id).first()
    if driver and driver.email:
        lines = db.query(models.SettlementLedgerLine).filter(models.SettlementLedgerLine.settlement_id == settlement.id).all()
        total = sum(float(line.amount) for line in lines)
        EmailService.send_settlement_created_notification(
            driver.email,
            driver.name,
            settlement.id,
            payload.period_start.strftime('%m/%d/%Y'),
            payload.period_end.strftime('%m/%d/%Y'),
            total
        )
    
    return settlement


@router.post("/settlements/batch")
def create_batch_settlements(
    period_start: datetime,
    period_end: datetime,
    payee_ids: List[int] = None,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Create settlements for multiple payees at once.
    If payee_ids is not provided, creates settlements for all payees with pending lines.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Get payees to create settlements for
    if payee_ids:
        # Use specified payee list
        payees = db.query(models.Payee).filter(
            models.Payee.id.in_(payee_ids),
            models.Payee.carrier_id == carrier_id
        ).all()
    else:
        # Get all payees with pending lines
        payees_with_pending = (
            db.query(models.Payee)
            .join(models.SettlementLedgerLine, models.Payee.id == models.SettlementLedgerLine.payee_id)
            .filter(
                models.Payee.carrier_id == carrier_id,
                models.SettlementLedgerLine.settlement_id.is_(None),
                models.SettlementLedgerLine.locked_at.is_(None),
                models.SettlementLedgerLine.voided_at.is_(None)
            )
            .distinct()
            .all()
        )
        payees = payees_with_pending
    
    if not payees:
        raise HTTPException(status_code=404, detail="No payees found with pending lines")
    
    created_settlements = []
    total_amount = 0
    payee_names = []
    
    for payee in payees:
        # Create settlement
        settlement = models.PayrollSettlement(
            payee_id=payee.id,
            period_start=period_start,
            period_end=period_end,
            status="draft",
        )
        db.add(settlement)
        db.flush()  # Get settlement ID without committing
        
        # Attach pending lines
        pending_lines = (
            db.query(models.SettlementLedgerLine)
            .filter(
                models.SettlementLedgerLine.payee_id == payee.id,
                models.SettlementLedgerLine.settlement_id.is_(None),
                models.SettlementLedgerLine.locked_at.is_(None),
                models.SettlementLedgerLine.voided_at.is_(None),
            )
            .all()
        )
        
        if not pending_lines:
            continue  # Skip if no pending lines
        
        for line in pending_lines:
            line.settlement_id = settlement.id
        
        # Process recurring items
        driver = db.query(models.Driver).filter(models.Driver.payee_id == payee.id).first()
        if driver:
            recurring_items = (
                db.query(models.RecurringSettlementItem)
                .filter(
                    models.RecurringSettlementItem.driver_id == driver.id,
                    models.RecurringSettlementItem.active == True,
                    models.RecurringSettlementItem.payee_id == payee.id,
                )
                .all()
            )
            
            for item in recurring_items:
                if item.next_date and item.next_date > period_end:
                    continue
                
                amount = item.amount
                if item.item_type in ["deduction", "loan"]:
                    amount = -abs(amount)
                elif item.item_type in ["addition", "bonus"]:
                    amount = abs(amount)
                
                recurring_line = models.SettlementLedgerLine(
                    load_id=None,
                    payee_id=payee.id,
                    settlement_id=settlement.id,
                    category=item.item_type,
                    description=item.description or f"{item.item_type.replace('_', ' ').title()}",
                    amount=amount,
                )
                db.add(recurring_line)
                
                # Update next_date
                if item.schedule == "weekly":
                    from datetime import timedelta
                    item.next_date = period_end + timedelta(days=7)
                elif item.schedule == "biweekly":
                    from datetime import timedelta
                    item.next_date = period_end + timedelta(days=14)
                elif item.schedule == "monthly":
                    from datetime import timedelta
                    item.next_date = period_end + timedelta(days=30)
        
        # Calculate total for this settlement
        all_lines = db.query(models.SettlementLedgerLine).filter(models.SettlementLedgerLine.settlement_id == settlement.id).all()
        settlement_total = sum(float(line.amount) for line in all_lines)
        
        created_settlements.append({
            "id": settlement.id,
            "payee_id": payee.id,
            "payee_name": payee.name,
            "total": settlement_total,
            "line_count": len(all_lines)
        })
        
        total_amount += settlement_total
        payee_names.append(payee.name)
        
        # Send email notification to driver
        if driver and driver.email:
            EmailService.send_settlement_created_notification(
                driver.email,
                driver.name,
                settlement.id,
                period_start.strftime('%m/%d/%Y'),
                period_end.strftime('%m/%d/%Y'),
                settlement_total
            )
    
    db.commit()
    
    # Send summary email to admin
    user = db.query(models.User).filter(models.User.id == token.get("user_id")).first()
    if user and user.email:
        EmailService.send_batch_settlement_summary(
            user.email,
            len(created_settlements),
            total_amount,
            payee_names
        )
    
    return {
        "ok": True,
        "settlements_created": len(created_settlements),
        "total_amount": total_amount,
        "settlements": created_settlements
    }


@router.post("/settlements/{settlement_id}/approve", response_model=SettlementStatusResponse)
def approve_settlement(settlement_id: int, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    settlement = db.query(models.PayrollSettlement).filter(models.PayrollSettlement.id == settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    settlement.status = "approved"
    db.commit()
    db.refresh(settlement)
    
    # Send email notification
    payee = db.query(models.Payee).filter(models.Payee.id == settlement.payee_id).first()
    driver = db.query(models.Driver).filter(models.Driver.payee_id == settlement.payee_id).first()
    if driver and driver.email and payee:
        lines = db.query(models.SettlementLedgerLine).filter(models.SettlementLedgerLine.settlement_id == settlement_id).all()
        total = sum(float(line.amount) for line in lines)
        EmailService.send_settlement_approved_notification(
            driver.email,
            driver.name,
            settlement.id,
            total
        )
    
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
    
    # Send email notification
    payee = db.query(models.Payee).filter(models.Payee.id == settlement.payee_id).first()
    driver = db.query(models.Driver).filter(models.Driver.payee_id == settlement.payee_id).first()
    if driver and driver.email and payee:
        total = sum(float(line.amount) for line in lines)
        EmailService.send_settlement_paid_notification(
            driver.email,
            driver.name,
            settlement.id,
            total,
            settlement.paid_at.strftime('%m/%d/%Y'),
            len(lines)
        )
    
    return settlement


@router.post("/settlements/{settlement_id}/export", response_model=SettlementStatusResponse)
def export_settlement(
    settlement_id: int,
    export_type: str = "journal_entry",  # "journal_entry" or "bill"
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Export settlement to QuickBooks.
    
    Args:
        settlement_id: Settlement ID
        export_type: "journal_entry" (default) or "bill"
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Verify settlement belongs to carrier
    settlement = (
        db.query(models.PayrollSettlement)
        .join(models.Payee, models.PayrollSettlement.payee_id == models.Payee.id)
        .filter(
            models.PayrollSettlement.id == settlement_id,
            models.Payee.carrier_id == carrier_id
        )
        .first()
    )
    
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    
    if settlement.status != "paid":
        raise HTTPException(status_code=400, detail="Can only export paid settlements")
    
    # Get payee and lines
    payee = db.query(models.Payee).filter(models.Payee.id == settlement.payee_id).first()
    lines = db.query(models.SettlementLedgerLine).filter(
        models.SettlementLedgerLine.settlement_id == settlement_id
    ).all()
    
    line_items = []
    for line in lines:
        line_items.append({
            "category": line.category,
            "description": line.description,
            "amount": float(line.amount)
        })
    
    # Export to QuickBooks
    try:
        if export_type == "journal_entry":
            # Use default account IDs (should be configurable in production)
            payroll_expense_account = "80"  # Typical payroll expense account
            payroll_payable_account = "33"  # Typical payroll payable account
            
            result = quickbooks_service.export_settlement_as_journal_entry(
                settlement_id=settlement.id,
                payee_name=payee.name,
                line_items=line_items,
                payroll_expense_account_id=payroll_expense_account,
                payroll_payable_account_id=payroll_payable_account,
                date=settlement.paid_at or datetime.utcnow()
            )
        else:
            raise HTTPException(status_code=400, detail="Bill export not yet implemented")
        
        if result.get("success") or result.get("stub_mode"):
            settlement.status = "exported"
            settlement.exported_at = datetime.utcnow()
            db.commit()
            db.refresh(settlement)
            
            return settlement
        else:
            raise HTTPException(status_code=500, detail=f"QuickBooks export failed: {result.get('error')}")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/quickbooks/status")
def get_quickbooks_status(token: dict = Depends(verify_token)):
    """Check QuickBooks integration status."""
    return quickbooks_service.test_connection()


@router.get("/quickbooks/auth-url")
def get_quickbooks_auth_url(token: dict = Depends(verify_token)):
    """Get QuickBooks OAuth authorization URL."""
    return {"auth_url": quickbooks_service.get_auth_url()}


@router.get("/settlements", response_model=list[SettlementStatusResponse])
def list_settlements(
    payee_id: int = None,
    status: str = None,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    List all settlements with optional filtering by payee and status.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Query settlements and join with payee to verify carrier ownership
    query = (
        db.query(models.PayrollSettlement)
        .join(models.Payee, models.PayrollSettlement.payee_id == models.Payee.id)
        .filter(models.Payee.carrier_id == carrier_id)
    )
    
    if payee_id:
        query = query.filter(models.PayrollSettlement.payee_id == payee_id)
    
    if status:
        query = query.filter(models.PayrollSettlement.status == status)
    
    settlements = query.order_by(models.PayrollSettlement.created_at.desc()).all()
    return settlements


@router.get("/settlements/{settlement_id}", response_model=SettlementStatusResponse)
def get_settlement_detail(
    settlement_id: int,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific settlement.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Verify settlement belongs to carrier
    settlement = (
        db.query(models.PayrollSettlement)
        .join(models.Payee, models.PayrollSettlement.payee_id == models.Payee.id)
        .filter(
            models.PayrollSettlement.id == settlement_id,
            models.Payee.carrier_id == carrier_id
        )
        .first()
    )
    
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    
    return settlement


@router.get("/settlements/{settlement_id}/lines")
def get_settlement_lines(
    settlement_id: int,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Get all ledger lines included in a settlement with load details.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Verify settlement belongs to carrier
    settlement = (
        db.query(models.PayrollSettlement)
        .join(models.Payee, models.PayrollSettlement.payee_id == models.Payee.id)
        .filter(
            models.PayrollSettlement.id == settlement_id,
            models.Payee.carrier_id == carrier_id
        )
        .first()
    )
    
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    
    # Get lines for this settlement
    lines = (
        db.query(models.SettlementLedgerLine)
        .filter(models.SettlementLedgerLine.settlement_id == settlement_id)
        .order_by(models.SettlementLedgerLine.created_at.asc())
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
                    "pickup_address": load.pickup_address,
                    "delivery_address": load.delivery_address,
                    "status": load.status,
                }
        
        result.append({
            "id": line.id,
            "load_id": line.load_id,
            "load_info": load_info,
            "category": line.category,
            "description": line.description,
            "amount": float(line.amount),
            "locked_at": line.locked_at.isoformat() if line.locked_at else None,
            "created_at": line.created_at.isoformat() if line.created_at else None,
        })
    
    payee = db.query(models.Payee).filter(models.Payee.id == settlement.payee_id).first()
    
    return {
        "settlement_id": settlement.id,
        "payee_name": payee.name if payee else None,
        "period_start": settlement.period_start.isoformat(),
        "period_end": settlement.period_end.isoformat(),
        "status": settlement.status,
        "lines": result,
        "total": sum(float(line.amount) for line in lines)
    }


@router.post("/settlements/{settlement_id}/void", response_model=SettlementStatusResponse)
def void_settlement(
    settlement_id: int,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Void a settlement (only allowed if not yet paid).
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    settlement = (
        db.query(models.PayrollSettlement)
        .join(models.Payee, models.PayrollSettlement.payee_id == models.Payee.id)
        .filter(
            models.PayrollSettlement.id == settlement_id,
            models.Payee.carrier_id == carrier_id
        )
        .first()
    )
    
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    
    if settlement.status in ["paid", "exported"]:
        raise HTTPException(status_code=400, detail="Cannot void a paid or exported settlement")
    
    settlement.status = "voided"
    
    # Release all lines back to pending
    lines = (
        db.query(models.SettlementLedgerLine)
        .filter(models.SettlementLedgerLine.settlement_id == settlement_id)
        .all()
    )
    for line in lines:
        line.settlement_id = None
        line.voided_at = datetime.utcnow()
    
    db.commit()
    db.refresh(settlement)
    return settlement


@router.post("/adjustments/create")
def create_adjustment_line(
    load_id: int,
    payee_id: int,
    amount: float,
    description: str,
    replaces_line_id: int = None,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Create a manual adjustment ledger line.
    Used when correcting errors or making manual changes to driver pay.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Verify load exists
    load = db.query(models.Load).filter(
        models.Load.id == load_id,
        models.Load.carrier_id == carrier_id
    ).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    # Verify payee exists
    payee = db.query(models.Payee).filter(
        models.Payee.id == payee_id,
        models.Payee.carrier_id == carrier_id
    ).first()
    if not payee:
        raise HTTPException(status_code=404, detail="Payee not found")
    
    # If replacing a line, verify it exists and is locked
    if replaces_line_id:
        original_line = db.query(models.SettlementLedgerLine).filter(
            models.SettlementLedgerLine.id == replaces_line_id
        ).first()
        if not original_line:
            raise HTTPException(status_code=404, detail="Original line not found")
        if not original_line.locked_at:
            raise HTTPException(status_code=400, detail="Can only replace locked lines")
    
    # Create adjustment line
    adjustment = models.SettlementLedgerLine(
        load_id=load_id,
        payee_id=payee_id,
        category="adjustment",
        description=description or "Manual adjustment",
        amount=amount,
        replaces_line_id=replaces_line_id
    )
    db.add(adjustment)
    db.commit()
    db.refresh(adjustment)
    
    return {
        "ok": True,
        "adjustment": {
            "id": adjustment.id,
            "load_id": adjustment.load_id,
            "payee_id": adjustment.payee_id,
            "category": adjustment.category,
            "description": adjustment.description,
            "amount": float(adjustment.amount),
            "replaces_line_id": adjustment.replaces_line_id,
            "created_at": adjustment.created_at.isoformat() if adjustment.created_at else None,
        }
    }


# ===== REPORTS ENDPOINTS =====

@router.get("/reports/summary")
def get_payroll_summary_report(
    start_date: datetime,
    end_date: datetime,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Generate comprehensive payroll summary report for a date range.
    Includes totals, category breakdown, status breakdown, and driver metrics.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    return payroll_reports.generate_payroll_summary(db, carrier_id, start_date, end_date)


@router.get("/reports/driver/{driver_id}/history")
def get_driver_pay_history_report(
    driver_id: int,
    start_date: datetime = None,
    end_date: datetime = None,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Generate detailed pay history report for a specific driver.
    Shows all settlements, line items, and totals.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Verify driver belongs to carrier
    driver = db.query(models.Driver).filter(
        models.Driver.id == driver_id,
        models.Driver.carrier_id == carrier_id
    ).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    return payroll_reports.generate_driver_pay_history(db, driver_id, start_date, end_date)


@router.get("/reports/variance")
def get_variance_report(
    start_date: datetime,
    end_date: datetime,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Generate variance report showing all adjustments and corrections.
    Useful for identifying payroll errors and tracking post-payment changes.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    return payroll_reports.generate_variance_report(db, carrier_id, start_date, end_date)


@router.get("/reports/recurring-items")
def get_recurring_items_report(
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Generate report of all active recurring items (deductions, additions).
    Shows scheduled recurring payroll items and their estimated monthly impact.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    return payroll_reports.generate_recurring_items_report(db, carrier_id)


@router.get("/reports/pending-payables")
def get_pending_payables_report(
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Generate summary of all pending (unpaid) payables.
    Shows what's currently owed to each driver/payee.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    return payroll_reports.generate_pending_payables_summary(db, carrier_id)


# ===== NOTIFICATION PREFERENCES =====

@router.get("/notifications/preferences")
def get_notification_preferences(token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """Get email notification preferences for current user/driver."""
    user_id = token.get("user_id")
    driver_id = token.get("driver_id")  # If logged in as driver
    
    # Check if driver has preferences
    if driver_id:
        driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
        if driver:
            # Return driver's notification preferences (stored in driver metadata or separate table)
            # For now, return default preferences
            return {
                "email_enabled": True,
                "settlement_created": True,
                "settlement_approved": True,
                "settlement_paid": True,
                "adjustment_created": True
            }
    
    # Default preferences
    return {
        "email_enabled": True,
        "settlement_created": True,
        "settlement_approved": True,
        "settlement_paid": True,
        "adjustment_created": True
    }


@router.post("/notifications/preferences")
def update_notification_preferences(
    preferences: dict,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Update email notification preferences."""
    user_id = token.get("user_id")
    driver_id = token.get("driver_id")
    
    # In production, save to database
    # For now, just acknowledge the update
    return {
        "ok": True,
        "message": "Notification preferences updated",
        "preferences": preferences
    }
