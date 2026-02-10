"""
Toll Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, TollTransaction, TollTransponder

router = APIRouter(prefix="/tolls", tags=["tolls"])


@router.get("/transactions")
def get_toll_transactions(
    load_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get toll transactions with optional filtering"""
    query = db.query(TollTransaction).filter(TollTransaction.carrier_id == current_user.carrier_id)
    
    if load_id:
        query = query.filter(TollTransaction.load_id == load_id)
    if driver_id:
        query = query.filter(TollTransaction.driver_id == driver_id)
    if status:
        query = query.filter(TollTransaction.status == status)
    
    transactions = query.order_by(TollTransaction.transaction_date.desc()).offset(skip).limit(limit).all()
    return transactions


@router.post("/transactions")
def create_toll_transaction(
    transaction_date: datetime,
    toll_authority: str,
    location: str,
    amount: float,
    load_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    equipment_id: Optional[int] = None,
    transponder_id: Optional[int] = None,
    reference_number: Optional[str] = None,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new toll transaction"""
    transaction = TollTransaction(
        carrier_id=current_user.carrier_id,
        load_id=load_id,
        driver_id=driver_id,
        equipment_id=equipment_id,
        transponder_id=transponder_id,
        transaction_date=transaction_date,
        toll_authority=toll_authority,
        location=location,
        amount=amount,
        reference_number=reference_number,
        notes=notes,
        status="pending"
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.put("/transactions/{transaction_id}")
def update_toll_transaction(
    transaction_id: int,
    status: Optional[str] = None,
    reimbursed: Optional[bool] = None,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a toll transaction"""
    transaction = db.query(TollTransaction).filter(
        TollTransaction.id == transaction_id,
        TollTransaction.carrier_id == current_user.carrier_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Toll transaction not found")
    
    if status is not None:
        transaction.status = status
    if reimbursed is not None:
        transaction.reimbursed = reimbursed
    if notes is not None:
        transaction.notes = notes
    
    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/transactions/{transaction_id}")
def delete_toll_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a toll transaction"""
    transaction = db.query(TollTransaction).filter(
        TollTransaction.id == transaction_id,
        TollTransaction.carrier_id == current_user.carrier_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Toll transaction not found")
    
    db.delete(transaction)
    db.commit()
    return {"message": "Toll transaction deleted"}


@router.get("/transponders")
def get_transponders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get toll transponders"""
    query = db.query(TollTransponder).filter(TollTransponder.carrier_id == current_user.carrier_id)
    
    if status:
        query = query.filter(TollTransponder.status == status)
    
    transponders = query.all()
    return transponders


@router.post("/transponders")
def create_transponder(
    transponder_number: str,
    provider: str,
    activation_date: datetime,
    equipment_id: Optional[int] = None,
    balance: float = 0.0,
    auto_replenish: bool = True,
    replenish_threshold: float = 20.0,
    replenish_amount: float = 50.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new toll transponder"""
    # Check if transponder number already exists
    existing = db.query(TollTransponder).filter(
        TollTransponder.transponder_number == transponder_number
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Transponder number already exists")
    
    transponder = TollTransponder(
        carrier_id=current_user.carrier_id,
        transponder_number=transponder_number,
        provider=provider,
        equipment_id=equipment_id,
        activation_date=activation_date,
        balance=balance,
        auto_replenish=auto_replenish,
        replenish_threshold=replenish_threshold,
        replenish_amount=replenish_amount,
        status="active"
    )
    
    db.add(transponder)
    db.commit()
    db.refresh(transponder)
    return transponder


@router.put("/transponders/{transponder_id}")
def update_transponder(
    transponder_id: int,
    equipment_id: Optional[int] = None,
    status: Optional[str] = None,
    balance: Optional[float] = None,
    auto_replenish: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a toll transponder"""
    transponder = db.query(TollTransponder).filter(
        TollTransponder.id == transponder_id,
        TollTransponder.carrier_id == current_user.carrier_id
    ).first()
    
    if not transponder:
        raise HTTPException(status_code=404, detail="Transponder not found")
    
    if equipment_id is not None:
        transponder.equipment_id = equipment_id
    if status is not None:
        transponder.status = status
        if status == "inactive":
            transponder.deactivation_date = datetime.utcnow()
    if balance is not None:
        transponder.balance = balance
    if auto_replenish is not None:
        transponder.auto_replenish = auto_replenish
    
    transponder.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(transponder)
    return transponder


@router.delete("/transponders/{transponder_id}")
def delete_transponder(
    transponder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a toll transponder"""
    transponder = db.query(TollTransponder).filter(
        TollTransponder.id == transponder_id,
        TollTransponder.carrier_id == current_user.carrier_id
    ).first()
    
    if not transponder:
        raise HTTPException(status_code=404, detail="Transponder not found")
    
    db.delete(transponder)
    db.commit()
    return {"message": "Transponder deleted"}


@router.get("/stats")
def get_toll_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get toll statistics"""
    from sqlalchemy import func
    
    total_amount = db.query(func.sum(TollTransaction.amount)).filter(
        TollTransaction.carrier_id == current_user.carrier_id
    ).scalar() or 0
    
    pending_amount = db.query(func.sum(TollTransaction.amount)).filter(
        TollTransaction.carrier_id == current_user.carrier_id,
        TollTransaction.status == "pending"
    ).scalar() or 0
    
    verified_amount = db.query(func.sum(TollTransaction.amount)).filter(
        TollTransaction.carrier_id == current_user.carrier_id,
        TollTransaction.status == "verified"
    ).scalar() or 0
    
    reimbursed_amount = db.query(func.sum(TollTransaction.amount)).filter(
        TollTransaction.carrier_id == current_user.carrier_id,
        TollTransaction.reimbursed == True
    ).scalar() or 0
    
    total_transactions = db.query(TollTransaction).filter(
        TollTransaction.carrier_id == current_user.carrier_id
    ).count()
    
    active_transponders = db.query(TollTransponder).filter(
        TollTransponder.carrier_id == current_user.carrier_id,
        TollTransponder.status == "active"
    ).count()
    
    return {
        "total_amount": total_amount,
        "pending_amount": pending_amount,
        "verified_amount": verified_amount,
        "reimbursed_amount": reimbursed_amount,
        "total_transactions": total_transactions,
        "active_transponders": active_transponders
    }
