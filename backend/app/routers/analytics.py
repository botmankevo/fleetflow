from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app import models
from app.core.security import verify_token
from datetime import datetime, timedelta

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/load-status")
def get_load_status_analytics(db: Session = Depends(get_db), token: dict = Depends(verify_token)):
    carrier_id = token.get("carrier_id")
    results = db.query(models.Load.status, func.count(models.Load.id)).filter(
        models.Load.carrier_id == carrier_id
    ).group_by(models.Load.status).all()
    return [{"status": r[0], "count": r[1]} for r in results]

@router.get("/revenue")
def get_revenue_analytics(db: Session = Depends(get_db), token: dict = Depends(verify_token)):
    carrier_id = token.get("carrier_id")
    # Mocking some trend data based on expenses/loads if real data isn't enough, 
    # but let's try to aggregate from expenses for now.
    # In a real app we'd have a 'revenue' or 'invoice' table.
    results = db.query(
        func.to_char(models.Load.created_at, 'YYYY-MM').label('month'),
        func.count(models.Load.id).label('count')
    ).filter(
        models.Load.carrier_id == carrier_id
    ).group_by('month').order_by('month').all()
    
    # We'll assign a random-ish revenue per load for the demo feel
    return [{"month": r[0], "loads_count": r[1], "estimated_revenue": r[1] * 1500} for r in results]

@router.get("/equipment-status")
def get_equipment_status_analytics(db: Session = Depends(get_db), token: dict = Depends(verify_token)):
    carrier_id = token.get("carrier_id")
    results = db.query(models.Equipment.status, func.count(models.Equipment.id)).filter(
        models.Equipment.carrier_id == carrier_id
    ).group_by(models.Equipment.status).all()
    return [{"status": r[0], "count": r[1]} for r in results]
