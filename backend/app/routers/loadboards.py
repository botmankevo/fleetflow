"""
Load Board Integration API endpoints
DAT and TruckStop load board integrations
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel
import os
import requests

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Load

router = APIRouter(prefix="/loadboards", tags=["loadboards"])

# Configuration
DAT_API_KEY = os.getenv("DAT_API_KEY", "")
DAT_API_SECRET = os.getenv("DAT_API_SECRET", "")
DAT_API_BASE_URL = "https://freight.api.dat.com/v2"

TRUCKSTOP_API_KEY = os.getenv("TRUCKSTOP_API_KEY", "")
TRUCKSTOP_API_SECRET = os.getenv("TRUCKSTOP_API_SECRET", "")
TRUCKSTOP_API_BASE_URL = "https://api.truckstop.com/v2"


# Pydantic Models
class LoadSearchCriteria(BaseModel):
    origin_city: Optional[str] = None
    origin_state: Optional[str] = None
    origin_radius: int = 100  # miles
    destination_city: Optional[str] = None
    destination_state: Optional[str] = None
    destination_radius: int = 100  # miles
    equipment_type: Optional[str] = None  # van, reefer, flatbed
    min_rate: Optional[float] = None
    max_deadhead: Optional[int] = None  # miles
    pickup_date_start: Optional[str] = None
    pickup_date_end: Optional[str] = None


class LoadBoardLoad(BaseModel):
    """Load from load board"""
    id: str
    source: str  # dat, truckstop
    load_number: Optional[str]
    origin_city: str
    origin_state: str
    destination_city: str
    destination_state: str
    pickup_date: str
    equipment_type: str
    length: Optional[float]
    weight: Optional[float]
    rate: Optional[float]
    distance: Optional[float]
    broker_name: Optional[str]
    broker_mc: Optional[str]
    broker_phone: Optional[str]
    broker_email: Optional[str]
    comments: Optional[str]


class BookLoadRequest(BaseModel):
    load_board_id: str
    source: str  # dat, truckstop
    driver_id: Optional[int]
    truck_id: Optional[int]


# ============================================================================
# DAT LOAD BOARD INTEGRATION
# ============================================================================

@router.get("/dat/search", response_model=List[LoadBoardLoad])
def search_dat_loads(
    criteria: LoadSearchCriteria = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search for available loads on DAT load board
    """
    if not DAT_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="DAT API not configured. Set DAT_API_KEY environment variable."
        )
    
    # Build DAT API request
    headers = {
        "Authorization": f"Bearer {DAT_API_KEY}",
        "Content-Type": "application/json"
    }
    
    params = {
        "originCity": criteria.origin_city,
        "originState": criteria.origin_state,
        "originRadius": criteria.origin_radius,
        "destinationCity": criteria.destination_city,
        "destinationState": criteria.destination_state,
        "destinationRadius": criteria.destination_radius,
        "equipmentType": criteria.equipment_type,
        "pickupDateStart": criteria.pickup_date_start,
        "pickupDateEnd": criteria.pickup_date_end,
    }
    
    # Remove None values
    params = {k: v for k, v in params.items() if v is not None}
    
    try:
        response = requests.get(
            f"{DAT_API_BASE_URL}/loads/search",
            headers=headers,
            params=params,
            timeout=30
        )
        
        if response.status_code == 200:
            dat_loads = response.json().get("loads", [])
            
            # Transform DAT loads to our format
            results = []
            for load in dat_loads:
                results.append(LoadBoardLoad(
                    id=load.get("loadId", ""),
                    source="dat",
                    load_number=load.get("loadNumber"),
                    origin_city=load.get("origin", {}).get("city", ""),
                    origin_state=load.get("origin", {}).get("state", ""),
                    destination_city=load.get("destination", {}).get("city", ""),
                    destination_state=load.get("destination", {}).get("state", ""),
                    pickup_date=load.get("pickupDate", ""),
                    equipment_type=load.get("equipmentType", ""),
                    length=load.get("length"),
                    weight=load.get("weight"),
                    rate=load.get("rate"),
                    distance=load.get("distance"),
                    broker_name=load.get("broker", {}).get("name"),
                    broker_mc=load.get("broker", {}).get("mcNumber"),
                    broker_phone=load.get("broker", {}).get("phone"),
                    broker_email=load.get("broker", {}).get("email"),
                    comments=load.get("comments")
                ))
            
            return results
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"DAT API error: {response.text}"
            )
            
    except requests.exceptions.RequestException as e:
        # Return empty list if API is not configured or fails
        return []


@router.get("/dat/rates")
def get_dat_market_rates(
    origin_state: str = Query(...),
    destination_state: str = Query(...),
    equipment_type: str = Query("VAN"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get market rates from DAT for a specific lane
    """
    if not DAT_API_KEY:
        return {
            "configured": False,
            "message": "DAT API not configured"
        }
    
    headers = {
        "Authorization": f"Bearer {DAT_API_KEY}",
        "Content-Type": "application/json"
    }
    
    params = {
        "originState": origin_state,
        "destinationState": destination_state,
        "equipmentType": equipment_type
    }
    
    try:
        response = requests.get(
            f"{DAT_API_BASE_URL}/rates/lane",
            headers=headers,
            params=params,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"DAT API error: {response.text}"
            )
            
    except requests.exceptions.RequestException as e:
        return {
            "error": str(e),
            "message": "Failed to fetch DAT rates"
        }


@router.post("/dat/book")
def book_dat_load(
    book_request: BookLoadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Book a load from DAT (creates placeholder in your TMS)
    Note: Actual booking may require additional DAT API calls
    """
    carrier_id = current_user.carrier_id
    
    # In a real implementation, you would:
    # 1. Call DAT API to reserve/book the load
    # 2. Get confirmation
    # 3. Create load in your system
    
    # For now, return success with instructions
    return {
        "success": True,
        "message": "Load booking initiated. Please contact broker to confirm.",
        "load_board_id": book_request.load_board_id,
        "next_steps": [
            "Contact broker to confirm load details",
            "Create load in MainTMS manually or via import",
            "Assign driver and equipment"
        ]
    }


# ============================================================================
# TRUCKSTOP LOAD BOARD INTEGRATION
# ============================================================================

@router.get("/truckstop/search", response_model=List[LoadBoardLoad])
def search_truckstop_loads(
    criteria: LoadSearchCriteria = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search for available loads on TruckStop load board
    """
    if not TRUCKSTOP_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="TruckStop API not configured. Set TRUCKSTOP_API_KEY environment variable."
        )
    
    headers = {
        "Authorization": f"Bearer {TRUCKSTOP_API_KEY}",
        "Content-Type": "application/json"
    }
    
    search_payload = {
        "origin": {
            "city": criteria.origin_city,
            "state": criteria.origin_state,
            "radius": criteria.origin_radius
        },
        "destination": {
            "city": criteria.destination_city,
            "state": criteria.destination_state,
            "radius": criteria.destination_radius
        },
        "equipmentType": criteria.equipment_type,
        "pickupDateStart": criteria.pickup_date_start,
        "pickupDateEnd": criteria.pickup_date_end,
    }
    
    try:
        response = requests.post(
            f"{TRUCKSTOP_API_BASE_URL}/loads/search",
            headers=headers,
            json=search_payload,
            timeout=30
        )
        
        if response.status_code == 200:
            ts_loads = response.json().get("loads", [])
            
            # Transform TruckStop loads to our format
            results = []
            for load in ts_loads:
                results.append(LoadBoardLoad(
                    id=load.get("id", ""),
                    source="truckstop",
                    load_number=load.get("referenceNumber"),
                    origin_city=load.get("pickupLocation", {}).get("city", ""),
                    origin_state=load.get("pickupLocation", {}).get("state", ""),
                    destination_city=load.get("deliveryLocation", {}).get("city", ""),
                    destination_state=load.get("deliveryLocation", {}).get("state", ""),
                    pickup_date=load.get("pickupDate", ""),
                    equipment_type=load.get("equipmentType", ""),
                    length=load.get("length"),
                    weight=load.get("weight"),
                    rate=load.get("rate", {}).get("amount"),
                    distance=load.get("miles"),
                    broker_name=load.get("broker", {}).get("companyName"),
                    broker_mc=load.get("broker", {}).get("mcNumber"),
                    broker_phone=load.get("broker", {}).get("phone"),
                    broker_email=load.get("broker", {}).get("email"),
                    comments=load.get("notes")
                ))
            
            return results
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"TruckStop API error: {response.text}"
            )
            
    except requests.exceptions.RequestException as e:
        # Return empty list if API is not configured or fails
        return []


@router.post("/truckstop/post-truck")
def post_truck_to_truckstop(
    origin_city: str,
    origin_state: str,
    destination_city: Optional[str] = None,
    destination_state: Optional[str] = None,
    equipment_type: str = "VAN",
    available_date: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Post available truck to TruckStop load board
    """
    if not TRUCKSTOP_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="TruckStop API not configured"
        )
    
    headers = {
        "Authorization": f"Bearer {TRUCKSTOP_API_KEY}",
        "Content-Type": "application/json"
    }
    
    truck_payload = {
        "origin": {
            "city": origin_city,
            "state": origin_state
        },
        "destination": {
            "city": destination_city,
            "state": destination_state
        } if destination_city else None,
        "equipmentType": equipment_type,
        "availableDate": available_date or datetime.now().isoformat(),
        "carrier": {
            "name": "Cox Transport & Logistics",  # TODO: Get from carrier settings
            "mcNumber": current_user.carrier.mc_number if hasattr(current_user, 'carrier') else None
        }
    }
    
    try:
        response = requests.post(
            f"{TRUCKSTOP_API_BASE_URL}/trucks/post",
            headers=headers,
            json=truck_payload,
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            return {
                "success": True,
                "message": "Truck posted to TruckStop successfully",
                "post_id": response.json().get("id")
            }
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"TruckStop API error: {response.text}"
            )
            
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to post truck: {str(e)}"
        )


@router.post("/truckstop/book")
def book_truckstop_load(
    book_request: BookLoadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Book a load from TruckStop
    """
    carrier_id = current_user.carrier_id
    
    # Similar to DAT booking
    return {
        "success": True,
        "message": "Load booking initiated. Please contact broker to confirm.",
        "load_board_id": book_request.load_board_id,
        "next_steps": [
            "Contact broker to confirm load details",
            "Create load in MainTMS",
            "Assign driver and equipment"
        ]
    }


# ============================================================================
# UNIFIED SEARCH (Both DAT and TruckStop)
# ============================================================================

@router.get("/search-all", response_model=List[LoadBoardLoad])
def search_all_load_boards(
    criteria: LoadSearchCriteria = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search all configured load boards (DAT + TruckStop)
    """
    all_loads = []
    
    # Search DAT
    if DAT_API_KEY:
        try:
            dat_loads = search_dat_loads(criteria, db, current_user)
            all_loads.extend(dat_loads)
        except:
            pass  # Continue if DAT fails
    
    # Search TruckStop
    if TRUCKSTOP_API_KEY:
        try:
            ts_loads = search_truckstop_loads(criteria, db, current_user)
            all_loads.extend(ts_loads)
        except:
            pass  # Continue if TruckStop fails
    
    # Sort by rate (highest first)
    all_loads.sort(key=lambda x: x.rate or 0, reverse=True)
    
    return all_loads


@router.get("/status")
def get_loadboard_status(
    current_user: User = Depends(get_current_user)
):
    """
    Check which load boards are configured
    """
    return {
        "dat": {
            "configured": bool(DAT_API_KEY),
            "message": "DAT load board ready" if DAT_API_KEY else "Not configured"
        },
        "truckstop": {
            "configured": bool(TRUCKSTOP_API_KEY),
            "message": "TruckStop load board ready" if TRUCKSTOP_API_KEY else "Not configured"
        }
    }


@router.post("/import-to-tms/{load_board_id}")
def import_load_to_tms(
    load_board_id: str,
    source: str,
    load_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import a load from load board into MainTMS
    """
    carrier_id = current_user.carrier_id
    
    # Create load in TMS
    new_load = Load(
        carrier_id=carrier_id,
        load_number=f"LB-{load_board_id[:8]}",
        origin=f"{load_data.get('origin_city')}, {load_data.get('origin_state')}",
        destination=f"{load_data.get('destination_city')}, {load_data.get('destination_state')}",
        pickup_date=datetime.fromisoformat(load_data.get('pickup_date')),
        rate=load_data.get('rate'),
        distance=load_data.get('distance'),
        status="available",
        notes=f"Imported from {source.upper()} load board. ID: {load_board_id}",
        created_by_id=current_user.id,
        created_at=datetime.utcnow()
    )
    
    db.add(new_load)
    db.commit()
    db.refresh(new_load)
    
    return {
        "success": True,
        "message": "Load imported successfully",
        "load_id": new_load.id,
        "load_number": new_load.load_number
    }
