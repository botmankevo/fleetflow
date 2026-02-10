"""
IFTA Reporting API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, IftaReport, IftaEntry

router = APIRouter(prefix="/ifta", tags=["ifta"])


@router.get("/reports")
def get_ifta_reports(
    year: Optional[int] = None,
    quarter: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get IFTA reports with optional filtering"""
    query = db.query(IftaReport).filter(IftaReport.carrier_id == current_user.carrier_id)
    
    if year:
        query = query.filter(IftaReport.year == year)
    if quarter:
        query = query.filter(IftaReport.quarter == quarter)
    if status:
        query = query.filter(IftaReport.status == status)
    
    reports = query.order_by(IftaReport.year.desc(), IftaReport.quarter.desc()).all()
    return reports


@router.get("/reports/{report_id}")
def get_ifta_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific IFTA report with entries"""
    report = db.query(IftaReport).filter(
        IftaReport.id == report_id,
        IftaReport.carrier_id == current_user.carrier_id
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="IFTA report not found")
    
    # Get entries for this report
    entries = db.query(IftaEntry).filter(
        IftaEntry.report_id == report_id
    ).all()
    
    # Group by jurisdiction
    from sqlalchemy import func
    by_jurisdiction = db.query(
        IftaEntry.jurisdiction,
        func.sum(IftaEntry.miles).label('total_miles'),
        func.sum(IftaEntry.gallons).label('total_gallons')
    ).filter(
        IftaEntry.report_id == report_id
    ).group_by(IftaEntry.jurisdiction).all()
    
    return {
        "report": report,
        "entries": entries,
        "summary": [
            {
                "jurisdiction": item.jurisdiction,
                "miles": item.total_miles,
                "gallons": item.total_gallons,
                "mpg": round(item.total_miles / item.total_gallons, 2) if item.total_gallons > 0 else 0
            }
            for item in by_jurisdiction
        ]
    }


@router.post("/reports")
def create_ifta_report(
    quarter: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new IFTA report"""
    # Check if report already exists
    existing = db.query(IftaReport).filter(
        IftaReport.carrier_id == current_user.carrier_id,
        IftaReport.quarter == quarter,
        IftaReport.year == year
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Report for this quarter already exists")
    
    report = IftaReport(
        carrier_id=current_user.carrier_id,
        quarter=quarter,
        year=year,
        status="draft"
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.put("/reports/{report_id}")
def update_ifta_report(
    report_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an IFTA report"""
    report = db.query(IftaReport).filter(
        IftaReport.id == report_id,
        IftaReport.carrier_id == current_user.carrier_id
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="IFTA report not found")
    
    if status:
        report.status = status
    
    # Recalculate totals
    from sqlalchemy import func
    totals = db.query(
        func.sum(IftaEntry.miles).label('total_miles'),
        func.sum(IftaEntry.gallons).label('total_gallons')
    ).filter(
        IftaEntry.report_id == report_id
    ).first()
    
    report.total_miles = totals.total_miles or 0
    report.total_gallons = totals.total_gallons or 0
    report.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(report)
    return report


@router.delete("/reports/{report_id}")
def delete_ifta_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an IFTA report"""
    report = db.query(IftaReport).filter(
        IftaReport.id == report_id,
        IftaReport.carrier_id == current_user.carrier_id
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="IFTA report not found")
    
    # Delete associated entries
    db.query(IftaEntry).filter(IftaEntry.report_id == report_id).delete()
    
    db.delete(report)
    db.commit()
    return {"message": "IFTA report deleted"}


@router.get("/entries")
def get_ifta_entries(
    report_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    jurisdiction: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get IFTA entries with optional filtering"""
    query = db.query(IftaEntry).filter(IftaEntry.carrier_id == current_user.carrier_id)
    
    if report_id:
        query = query.filter(IftaEntry.report_id == report_id)
    if driver_id:
        query = query.filter(IftaEntry.driver_id == driver_id)
    if jurisdiction:
        query = query.filter(IftaEntry.jurisdiction == jurisdiction)
    
    entries = query.order_by(IftaEntry.entry_date.desc()).offset(skip).limit(limit).all()
    return entries


@router.post("/entries")
def create_ifta_entry(
    jurisdiction: str,
    entry_date: datetime,
    miles: float,
    gallons: float,
    report_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    equipment_id: Optional[int] = None,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new IFTA entry"""
    entry = IftaEntry(
        carrier_id=current_user.carrier_id,
        report_id=report_id,
        driver_id=driver_id,
        equipment_id=equipment_id,
        jurisdiction=jurisdiction,
        entry_date=entry_date,
        miles=miles,
        gallons=gallons,
        notes=notes
    )
    
    db.add(entry)
    db.commit()
    db.refresh(entry)
    
    # Update report totals if report_id is provided
    if report_id:
        update_report_totals(db, report_id)
    
    return entry


@router.put("/entries/{entry_id}")
def update_ifta_entry(
    entry_id: int,
    jurisdiction: Optional[str] = None,
    entry_date: Optional[datetime] = None,
    miles: Optional[float] = None,
    gallons: Optional[float] = None,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an IFTA entry"""
    entry = db.query(IftaEntry).filter(
        IftaEntry.id == entry_id,
        IftaEntry.carrier_id == current_user.carrier_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="IFTA entry not found")
    
    if jurisdiction is not None:
        entry.jurisdiction = jurisdiction
    if entry_date is not None:
        entry.entry_date = entry_date
    if miles is not None:
        entry.miles = miles
    if gallons is not None:
        entry.gallons = gallons
    if notes is not None:
        entry.notes = notes
    
    db.commit()
    db.refresh(entry)
    
    # Update report totals
    if entry.report_id:
        update_report_totals(db, entry.report_id)
    
    return entry


@router.delete("/entries/{entry_id}")
def delete_ifta_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an IFTA entry"""
    entry = db.query(IftaEntry).filter(
        IftaEntry.id == entry_id,
        IftaEntry.carrier_id == current_user.carrier_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="IFTA entry not found")
    
    report_id = entry.report_id
    db.delete(entry)
    db.commit()
    
    # Update report totals
    if report_id:
        update_report_totals(db, report_id)
    
    return {"message": "IFTA entry deleted"}


@router.get("/jurisdictions")
def get_jurisdictions():
    """Get list of IFTA jurisdictions"""
    return {
        "jurisdictions": [
            {"code": "AL", "name": "Alabama"},
            {"code": "AZ", "name": "Arizona"},
            {"code": "AR", "name": "Arkansas"},
            {"code": "CA", "name": "California"},
            {"code": "CO", "name": "Colorado"},
            {"code": "CT", "name": "Connecticut"},
            {"code": "DE", "name": "Delaware"},
            {"code": "FL", "name": "Florida"},
            {"code": "GA", "name": "Georgia"},
            {"code": "ID", "name": "Idaho"},
            {"code": "IL", "name": "Illinois"},
            {"code": "IN", "name": "Indiana"},
            {"code": "IA", "name": "Iowa"},
            {"code": "KS", "name": "Kansas"},
            {"code": "KY", "name": "Kentucky"},
            {"code": "LA", "name": "Louisiana"},
            {"code": "ME", "name": "Maine"},
            {"code": "MD", "name": "Maryland"},
            {"code": "MA", "name": "Massachusetts"},
            {"code": "MI", "name": "Michigan"},
            {"code": "MN", "name": "Minnesota"},
            {"code": "MS", "name": "Mississippi"},
            {"code": "MO", "name": "Missouri"},
            {"code": "MT", "name": "Montana"},
            {"code": "NE", "name": "Nebraska"},
            {"code": "NV", "name": "Nevada"},
            {"code": "NH", "name": "New Hampshire"},
            {"code": "NJ", "name": "New Jersey"},
            {"code": "NM", "name": "New Mexico"},
            {"code": "NY", "name": "New York"},
            {"code": "NC", "name": "North Carolina"},
            {"code": "ND", "name": "North Dakota"},
            {"code": "OH", "name": "Ohio"},
            {"code": "OK", "name": "Oklahoma"},
            {"code": "OR", "name": "Oregon"},
            {"code": "PA", "name": "Pennsylvania"},
            {"code": "RI", "name": "Rhode Island"},
            {"code": "SC", "name": "South Carolina"},
            {"code": "SD", "name": "South Dakota"},
            {"code": "TN", "name": "Tennessee"},
            {"code": "TX", "name": "Texas"},
            {"code": "UT", "name": "Utah"},
            {"code": "VT", "name": "Vermont"},
            {"code": "VA", "name": "Virginia"},
            {"code": "WA", "name": "Washington"},
            {"code": "WV", "name": "West Virginia"},
            {"code": "WI", "name": "Wisconsin"},
            {"code": "WY", "name": "Wyoming"},
            {"code": "AB", "name": "Alberta"},
            {"code": "BC", "name": "British Columbia"},
            {"code": "MB", "name": "Manitoba"},
            {"code": "NB", "name": "New Brunswick"},
            {"code": "NL", "name": "Newfoundland and Labrador"},
            {"code": "NT", "name": "Northwest Territories"},
            {"code": "NS", "name": "Nova Scotia"},
            {"code": "NU", "name": "Nunavut"},
            {"code": "ON", "name": "Ontario"},
            {"code": "PE", "name": "Prince Edward Island"},
            {"code": "QC", "name": "Quebec"},
            {"code": "SK", "name": "Saskatchewan"},
            {"code": "YT", "name": "Yukon"}
        ]
    }


def update_report_totals(db: Session, report_id: int):
    """Helper function to update report totals"""
    from sqlalchemy import func
    
    totals = db.query(
        func.sum(IftaEntry.miles).label('total_miles'),
        func.sum(IftaEntry.gallons).label('total_gallons')
    ).filter(
        IftaEntry.report_id == report_id
    ).first()
    
    report = db.query(IftaReport).filter(IftaReport.id == report_id).first()
    if report:
        report.total_miles = totals.total_miles or 0
        report.total_gallons = totals.total_gallons or 0
        report.updated_at = datetime.utcnow()
        db.commit()
