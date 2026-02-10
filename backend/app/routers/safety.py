"""
Safety & Compliance API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, SafetyEvent, SafetyScore

router = APIRouter(prefix="/safety", tags=["safety"])


@router.get("/events")
def get_safety_events(
    driver_id: Optional[int] = None,
    event_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get safety events with optional filtering"""
    query = db.query(SafetyEvent).filter(SafetyEvent.carrier_id == current_user.carrier_id)
    
    if driver_id:
        query = query.filter(SafetyEvent.driver_id == driver_id)
    if event_type:
        query = query.filter(SafetyEvent.event_type == event_type)
    if status:
        query = query.filter(SafetyEvent.status == status)
    
    events = query.order_by(SafetyEvent.event_date.desc()).offset(skip).limit(limit).all()
    return events


@router.post("/events")
def create_safety_event(
    event_type: str,
    event_date: datetime,
    severity: str,
    description: str,
    driver_id: Optional[int] = None,
    equipment_id: Optional[int] = None,
    location: Optional[str] = None,
    citation_number: Optional[str] = None,
    points: int = 0,
    fine_amount: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new safety event"""
    event = SafetyEvent(
        carrier_id=current_user.carrier_id,
        driver_id=driver_id,
        equipment_id=equipment_id,
        event_type=event_type,
        event_date=event_date,
        severity=severity,
        description=description,
        location=location,
        citation_number=citation_number,
        points=points,
        fine_amount=fine_amount,
        status="open"
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    # Update driver safety score if driver is specified
    if driver_id:
        update_driver_safety_score(db, current_user.carrier_id, driver_id)
    
    return event


@router.put("/events/{event_id}")
def update_safety_event(
    event_id: int,
    status: Optional[str] = None,
    resolution_notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a safety event"""
    event = db.query(SafetyEvent).filter(
        SafetyEvent.id == event_id,
        SafetyEvent.carrier_id == current_user.carrier_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Safety event not found")
    
    if status:
        event.status = status
        if status == "resolved":
            event.resolved_at = datetime.utcnow()
    
    if resolution_notes:
        event.resolution_notes = resolution_notes
    
    event.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(event)
    
    # Update driver safety score
    if event.driver_id:
        update_driver_safety_score(db, current_user.carrier_id, event.driver_id)
    
    return event


@router.delete("/events/{event_id}")
def delete_safety_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a safety event"""
    event = db.query(SafetyEvent).filter(
        SafetyEvent.id == event_id,
        SafetyEvent.carrier_id == current_user.carrier_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Safety event not found")
    
    driver_id = event.driver_id
    db.delete(event)
    db.commit()
    
    # Update driver safety score
    if driver_id:
        update_driver_safety_score(db, current_user.carrier_id, driver_id)
    
    return {"message": "Safety event deleted"}


@router.get("/scores")
def get_safety_scores(
    driver_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get safety scores for all drivers or a specific driver"""
    query = db.query(SafetyScore).filter(SafetyScore.carrier_id == current_user.carrier_id)
    
    if driver_id:
        query = query.filter(SafetyScore.driver_id == driver_id)
    
    scores = query.all()
    return scores


@router.get("/scores/{driver_id}")
def get_driver_safety_score(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed safety score for a specific driver"""
    score = db.query(SafetyScore).filter(
        SafetyScore.driver_id == driver_id,
        SafetyScore.carrier_id == current_user.carrier_id
    ).first()
    
    if not score:
        # Create a default score if it doesn't exist
        score = SafetyScore(
            carrier_id=current_user.carrier_id,
            driver_id=driver_id,
            safety_rating="satisfactory"
        )
        db.add(score)
        db.commit()
        db.refresh(score)
    
    # Get recent events for this driver
    recent_events = db.query(SafetyEvent).filter(
        SafetyEvent.driver_id == driver_id,
        SafetyEvent.carrier_id == current_user.carrier_id
    ).order_by(SafetyEvent.event_date.desc()).limit(10).all()
    
    return {
        "score": score,
        "recent_events": recent_events
    }


@router.get("/stats")
def get_safety_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overall safety statistics"""
    total_events = db.query(SafetyEvent).filter(
        SafetyEvent.carrier_id == current_user.carrier_id
    ).count()
    
    open_events = db.query(SafetyEvent).filter(
        SafetyEvent.carrier_id == current_user.carrier_id,
        SafetyEvent.status == "open"
    ).count()
    
    accidents = db.query(SafetyEvent).filter(
        SafetyEvent.carrier_id == current_user.carrier_id,
        SafetyEvent.event_type == "accident"
    ).count()
    
    violations = db.query(SafetyEvent).filter(
        SafetyEvent.carrier_id == current_user.carrier_id,
        SafetyEvent.event_type == "violation"
    ).count()
    
    inspections = db.query(SafetyEvent).filter(
        SafetyEvent.carrier_id == current_user.carrier_id,
        SafetyEvent.event_type == "inspection"
    ).count()
    
    return {
        "total_events": total_events,
        "open_events": open_events,
        "accidents": accidents,
        "violations": violations,
        "inspections": inspections
    }


def update_driver_safety_score(db: Session, carrier_id: int, driver_id: int):
    """Helper function to update driver safety score"""
    score = db.query(SafetyScore).filter(
        SafetyScore.driver_id == driver_id,
        SafetyScore.carrier_id == carrier_id
    ).first()
    
    if not score:
        score = SafetyScore(carrier_id=carrier_id, driver_id=driver_id)
        db.add(score)
    
    # Count events
    accidents = db.query(SafetyEvent).filter(
        SafetyEvent.driver_id == driver_id,
        SafetyEvent.carrier_id == carrier_id,
        SafetyEvent.event_type == "accident"
    ).count()
    
    violations = db.query(SafetyEvent).filter(
        SafetyEvent.driver_id == driver_id,
        SafetyEvent.carrier_id == carrier_id,
        SafetyEvent.event_type == "violation"
    ).count()
    
    inspections = db.query(SafetyEvent).filter(
        SafetyEvent.driver_id == driver_id,
        SafetyEvent.carrier_id == carrier_id,
        SafetyEvent.event_type == "inspection"
    ).count()
    
    clean_inspections = db.query(SafetyEvent).filter(
        SafetyEvent.driver_id == driver_id,
        SafetyEvent.carrier_id == carrier_id,
        SafetyEvent.event_type == "inspection",
        SafetyEvent.severity == "low"
    ).count()
    
    # Get last dates
    last_violation = db.query(SafetyEvent).filter(
        SafetyEvent.driver_id == driver_id,
        SafetyEvent.carrier_id == carrier_id,
        SafetyEvent.event_type == "violation"
    ).order_by(SafetyEvent.event_date.desc()).first()
    
    last_inspection = db.query(SafetyEvent).filter(
        SafetyEvent.driver_id == driver_id,
        SafetyEvent.carrier_id == carrier_id,
        SafetyEvent.event_type == "inspection"
    ).order_by(SafetyEvent.event_date.desc()).first()
    
    # Update score
    score.accident_count = accidents
    score.violation_count = violations
    score.inspection_count = inspections
    score.clean_inspection_count = clean_inspections
    score.last_violation_date = last_violation.event_date if last_violation else None
    score.last_inspection_date = last_inspection.event_date if last_inspection else None
    score.updated_at = datetime.utcnow()
    
    # Determine safety rating
    if accidents >= 3 or violations >= 5:
        score.safety_rating = "unsatisfactory"
    elif accidents >= 1 or violations >= 2:
        score.safety_rating = "conditional"
    else:
        score.safety_rating = "satisfactory"
    
    db.commit()
