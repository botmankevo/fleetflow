"""
Dispatch board API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Load, Driver, Equipment, User

router = APIRouter(prefix="/dispatch", tags=["dispatch"])


class DispatchBoardStats(BaseModel):
    available_loads: int
    assigned_loads: int
    in_transit_loads: int
    delivered_today: int
    available_drivers: int
    available_trucks: int


class LoadAssignment(BaseModel):
    load_id: int
    driver_id: Optional[int] = None
    truck_id: Optional[int] = None
    status: Optional[str] = None


class QuickLoadSummary(BaseModel):
    id: int
    load_number: str
    status: str
    pickup_city: Optional[str] = None
    delivery_city: Optional[str] = None
    rate_amount: Optional[float] = None
    driver_name: Optional[str] = None
    truck_number: Optional[str] = None
    created_at: datetime


@router.get("/stats", response_model=DispatchBoardStats)
def get_dispatch_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get real-time dispatch board statistics
    """
    carrier_id = current_user.carrier_id
    
    # Count loads by status
    available_loads = db.query(func.count(Load.id)).filter(
        and_(
            Load.carrier_id == carrier_id,
            or_(Load.status == "Available", Load.status == "Created")
        )
    ).scalar() or 0
    
    assigned_loads = db.query(func.count(Load.id)).filter(
        and_(
            Load.carrier_id == carrier_id,
            Load.status == "Assigned"
        )
    ).scalar() or 0
    
    in_transit_loads = db.query(func.count(Load.id)).filter(
        and_(
            Load.carrier_id == carrier_id,
            or_(Load.status == "In Transit", Load.status == "Picked Up")
        )
    ).scalar() or 0
    
    # Delivered today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    delivered_today = db.query(func.count(Load.id)).filter(
        and_(
            Load.carrier_id == carrier_id,
            Load.status == "Delivered",
            Load.updated_at >= today_start
        )
    ).scalar() or 0
    
    # Available drivers (no active load)
    # Get driver IDs with active loads
    active_driver_ids = db.query(Load.driver_id).filter(
        and_(
            Load.carrier_id == carrier_id,
            Load.driver_id.isnot(None),
            Load.status.in_(["Assigned", "In Transit", "Picked Up"])
        )
    ).distinct().all()
    active_driver_ids = [d[0] for d in active_driver_ids]
    
    available_drivers = db.query(func.count(Driver.id)).filter(
        and_(
            Driver.carrier_id == carrier_id,
            ~Driver.id.in_(active_driver_ids) if active_driver_ids else True
        )
    ).scalar() or 0
    
    # Available trucks (not assigned to active loads)
    active_truck_ids = db.query(Equipment.id).join(
        Load, Load.id == Equipment.current_load_id
    ).filter(
        and_(
            Equipment.carrier_id == carrier_id,
            Load.status.in_(["Assigned", "In Transit", "Picked Up"])
        )
    ).distinct().all()
    active_truck_ids = [t[0] for t in active_truck_ids]
    
    available_trucks = db.query(func.count(Equipment.id)).filter(
        and_(
            Equipment.carrier_id == carrier_id,
            Equipment.type == "truck",
            ~Equipment.id.in_(active_truck_ids) if active_truck_ids else True
        )
    ).scalar() or 0
    
    return DispatchBoardStats(
        available_loads=available_loads,
        assigned_loads=assigned_loads,
        in_transit_loads=in_transit_loads,
        delivered_today=delivered_today,
        available_drivers=available_drivers,
        available_trucks=available_trucks
    )


@router.get("/loads-by-status")
def get_loads_by_status(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get loads grouped by status for dispatch board
    """
    carrier_id = current_user.carrier_id
    
    query = db.query(Load).filter(Load.carrier_id == carrier_id)
    
    if status:
        query = query.filter(Load.status == status)
    
    loads = query.order_by(Load.created_at.desc()).all()
    
    # Group by status
    grouped = {
        "available": [],
        "assigned": [],
        "in_transit": [],
        "delivered": []
    }
    
    for load in loads:
        load_data = {
            "id": load.id,
            "load_number": load.load_number,
            "status": load.status,
            "pickup_address": load.pickup_address,
            "delivery_address": load.delivery_address,
            "rate_amount": load.rate_amount,
            "driver_id": load.driver_id,
            "driver_name": f"{load.driver.first_name} {load.driver.last_name}" if load.driver else None,
            "created_at": load.created_at.isoformat(),
            "broker_name": load.broker_name,
            "notes": load.notes,
        }
        
        if load.status in ["Available", "Created"]:
            grouped["available"].append(load_data)
        elif load.status == "Assigned":
            grouped["assigned"].append(load_data)
        elif load.status in ["In Transit", "Picked Up"]:
            grouped["in_transit"].append(load_data)
        elif load.status == "Delivered":
            grouped["delivered"].append(load_data)
    
    return grouped


@router.get("/available-drivers")
def get_available_drivers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of drivers not currently assigned to active loads
    """
    carrier_id = current_user.carrier_id
    
    # Get driver IDs with active loads
    active_driver_ids = db.query(Load.driver_id).filter(
        and_(
            Load.carrier_id == carrier_id,
            Load.driver_id.isnot(None),
            Load.status.in_(["Assigned", "In Transit", "Picked Up"])
        )
    ).distinct().all()
    active_driver_ids = [d[0] for d in active_driver_ids]
    
    # Get available drivers
    drivers = db.query(Driver).filter(
        and_(
            Driver.carrier_id == carrier_id,
            ~Driver.id.in_(active_driver_ids) if active_driver_ids else True
        )
    ).all()
    
    return [
        {
            "id": driver.id,
            "name": f"{driver.first_name} {driver.last_name}",
            "phone": driver.phone,
            "email": driver.email,
        }
        for driver in drivers
    ]


@router.post("/assign-load")
def assign_load_to_driver(
    assignment: LoadAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Assign a load to a driver
    """
    carrier_id = current_user.carrier_id
    
    # Get load
    load = db.query(Load).filter(
        and_(
            Load.id == assignment.load_id,
            Load.carrier_id == carrier_id
        )
    ).first()
    
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    # Update load
    if assignment.driver_id:
        # Verify driver belongs to carrier
        driver = db.query(Driver).filter(
            and_(
                Driver.id == assignment.driver_id,
                Driver.carrier_id == carrier_id
            )
        ).first()
        
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")
        
        load.driver_id = assignment.driver_id
    
    if assignment.status:
        load.status = assignment.status
    elif assignment.driver_id and load.status == "Available":
        # Auto-update status to Assigned when driver is assigned
        load.status = "Assigned"
    
    load.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(load)
    
    return {
        "success": True,
        "message": "Load assigned successfully",
        "load": {
            "id": load.id,
            "load_number": load.load_number,
            "status": load.status,
            "driver_id": load.driver_id,
            "driver_name": f"{load.driver.first_name} {load.driver.last_name}" if load.driver else None,
        }
    }


@router.post("/update-load-status")
def update_load_status(
    load_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update load status from dispatch board
    """
    carrier_id = current_user.carrier_id
    
    # Validate status
    valid_statuses = ["Available", "Assigned", "In Transit", "Picked Up", "Delivered", "Cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    # Get load
    load = db.query(Load).filter(
        and_(
            Load.id == load_id,
            Load.carrier_id == carrier_id
        )
    ).first()
    
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    load.status = status
    load.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(load)
    
    return {
        "success": True,
        "message": f"Load status updated to {status}",
        "load": {
            "id": load.id,
            "load_number": load.load_number,
            "status": load.status,
        }
    }


@router.post("/unassign-load/{load_id}")
def unassign_load(
    load_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove driver assignment from load
    """
    carrier_id = current_user.carrier_id
    
    load = db.query(Load).filter(
        and_(
            Load.id == load_id,
            Load.carrier_id == carrier_id
        )
    ).first()
    
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    load.driver_id = None
    load.status = "Available"
    load.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(load)
    
    return {
        "success": True,
        "message": "Load unassigned successfully",
        "load": {
            "id": load.id,
            "load_number": load.load_number,
            "status": load.status,
        }
    }
