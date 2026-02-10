"""
Motive (KeepTruckin) ELD/Telematics Integration API endpoints
GPS tracking, HOS (Hours of Service), and vehicle data
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel
import os
import requests

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Driver, Load

router = APIRouter(prefix="/motive", tags=["motive"])

# Configuration
MOTIVE_API_KEY = os.getenv("MOTIVE_API_KEY", "")
MOTIVE_API_SECRET = os.getenv("MOTIVE_API_SECRET", "")
MOTIVE_API_BASE_URL = "https://api.gomotive.com/v1"


# Pydantic Models
class DriverLocation(BaseModel):
    """Current driver location from GPS"""
    driver_id: int
    driver_name: str
    latitude: float
    longitude: float
    speed: float  # mph
    heading: Optional[int]  # degrees
    timestamp: datetime
    address: Optional[str]


class HOSStatus(BaseModel):
    """Hours of Service status"""
    driver_id: int
    driver_name: str
    status: str  # on_duty, off_duty, driving, sleeper_berth
    time_until_break: Optional[int]  # minutes
    driving_hours_remaining: float
    shift_hours_remaining: float
    cycle_hours_remaining: float
    last_updated: datetime


class VehicleData(BaseModel):
    """Vehicle telemetry data"""
    vehicle_id: str
    vehicle_number: str
    odometer: float  # miles
    engine_hours: float
    fuel_level: Optional[float]  # percentage
    battery_voltage: Optional[float]
    engine_coolant_temp: Optional[float]
    last_updated: datetime


class TripData(BaseModel):
    """Trip/route information"""
    trip_id: str
    driver_id: int
    vehicle_id: str
    start_time: datetime
    end_time: Optional[datetime]
    start_location: str
    end_location: Optional[str]
    distance: float  # miles
    duration: Optional[int]  # minutes
    idle_time: Optional[int]  # minutes


# ============================================================================
# GPS TRACKING
# ============================================================================

@router.get("/location/{driver_id}", response_model=DriverLocation)
def get_driver_location(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current GPS location for a driver
    """
    if not MOTIVE_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Motive API not configured. Set MOTIVE_API_KEY environment variable."
        )
    
    # Get driver from database
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Call Motive API
    headers = {
        "Authorization": f"Bearer {MOTIVE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        # Note: Actual Motive API endpoint may differ
        response = requests.get(
            f"{MOTIVE_API_BASE_URL}/drivers/{driver.external_id}/location",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            location_data = response.json()
            
            return DriverLocation(
                driver_id=driver_id,
                driver_name=f"{driver.first_name} {driver.last_name}",
                latitude=location_data.get("latitude"),
                longitude=location_data.get("longitude"),
                speed=location_data.get("speed", 0),
                heading=location_data.get("heading"),
                timestamp=datetime.fromisoformat(location_data.get("timestamp")),
                address=location_data.get("address")
            )
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Motive API error: {response.text}"
            )
            
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch location: {str(e)}"
        )


@router.get("/locations/all", response_model=List[DriverLocation])
def get_all_driver_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current locations for all active drivers
    """
    if not MOTIVE_API_KEY:
        return []
    
    carrier_id = current_user.carrier_id
    
    # Get all active drivers
    drivers = db.query(Driver).filter(
        Driver.carrier_id == carrier_id,
        Driver.is_active == True
    ).all()
    
    locations = []
    headers = {
        "Authorization": f"Bearer {MOTIVE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    for driver in drivers:
        if not driver.external_id:
            continue
            
        try:
            response = requests.get(
                f"{MOTIVE_API_BASE_URL}/drivers/{driver.external_id}/location",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                location_data = response.json()
                locations.append(DriverLocation(
                    driver_id=driver.id,
                    driver_name=f"{driver.first_name} {driver.last_name}",
                    latitude=location_data.get("latitude"),
                    longitude=location_data.get("longitude"),
                    speed=location_data.get("speed", 0),
                    heading=location_data.get("heading"),
                    timestamp=datetime.fromisoformat(location_data.get("timestamp")),
                    address=location_data.get("address")
                ))
        except:
            continue  # Skip drivers with errors
    
    return locations


@router.get("/location/history/{driver_id}")
def get_location_history(
    driver_id: int,
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get location history for a driver over a date range
    """
    if not MOTIVE_API_KEY:
        raise HTTPException(status_code=500, detail="Motive API not configured")
    
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    headers = {
        "Authorization": f"Bearer {MOTIVE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    params = {
        "start_date": start_date,
        "end_date": end_date
    }
    
    try:
        response = requests.get(
            f"{MOTIVE_API_BASE_URL}/drivers/{driver.external_id}/location/history",
            headers=headers,
            params=params,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Motive API error: {response.text}"
            )
            
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch location history: {str(e)}"
        )


# ============================================================================
# HOURS OF SERVICE (HOS)
# ============================================================================

@router.get("/hos/{driver_id}", response_model=HOSStatus)
def get_driver_hos_status(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current HOS (Hours of Service) status for a driver
    """
    if not MOTIVE_API_KEY:
        raise HTTPException(status_code=500, detail="Motive API not configured")
    
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    headers = {
        "Authorization": f"Bearer {MOTIVE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{MOTIVE_API_BASE_URL}/drivers/{driver.external_id}/hos",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            hos_data = response.json()
            
            return HOSStatus(
                driver_id=driver_id,
                driver_name=f"{driver.first_name} {driver.last_name}",
                status=hos_data.get("current_status", "off_duty"),
                time_until_break=hos_data.get("time_until_break"),
                driving_hours_remaining=hos_data.get("driving_hours_remaining", 0),
                shift_hours_remaining=hos_data.get("shift_hours_remaining", 0),
                cycle_hours_remaining=hos_data.get("cycle_hours_remaining", 0),
                last_updated=datetime.fromisoformat(hos_data.get("last_updated"))
            )
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Motive API error: {response.text}"
            )
            
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch HOS status: {str(e)}"
        )


@router.get("/hos/violations")
def get_hos_violations(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get HOS violations for all drivers
    """
    if not MOTIVE_API_KEY:
        return {"violations": [], "message": "Motive API not configured"}
    
    carrier_id = current_user.carrier_id
    
    headers = {
        "Authorization": f"Bearer {MOTIVE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    params = {}
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    
    try:
        response = requests.get(
            f"{MOTIVE_API_BASE_URL}/hos/violations",
            headers=headers,
            params=params,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"violations": [], "error": response.text}
            
    except requests.exceptions.RequestException as e:
        return {"violations": [], "error": str(e)}


# ============================================================================
# VEHICLE DATA
# ============================================================================

@router.get("/vehicle/{vehicle_id}", response_model=VehicleData)
def get_vehicle_data(
    vehicle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current telemetry data for a vehicle
    """
    if not MOTIVE_API_KEY:
        raise HTTPException(status_code=500, detail="Motive API not configured")
    
    headers = {
        "Authorization": f"Bearer {MOTIVE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{MOTIVE_API_BASE_URL}/vehicles/{vehicle_id}",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            vehicle_data = response.json()
            
            return VehicleData(
                vehicle_id=vehicle_id,
                vehicle_number=vehicle_data.get("number", ""),
                odometer=vehicle_data.get("odometer", 0),
                engine_hours=vehicle_data.get("engine_hours", 0),
                fuel_level=vehicle_data.get("fuel_level"),
                battery_voltage=vehicle_data.get("battery_voltage"),
                engine_coolant_temp=vehicle_data.get("coolant_temp"),
                last_updated=datetime.fromisoformat(vehicle_data.get("last_updated"))
            )
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Motive API error: {response.text}"
            )
            
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch vehicle data: {str(e)}"
        )


@router.get("/vehicles/all")
def get_all_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get data for all vehicles in the fleet
    """
    if not MOTIVE_API_KEY:
        return []
    
    headers = {
        "Authorization": f"Bearer {MOTIVE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{MOTIVE_API_BASE_URL}/vehicles",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json().get("vehicles", [])
        else:
            return []
            
    except requests.exceptions.RequestException as e:
        return []


# ============================================================================
# TRIPS & ROUTES
# ============================================================================

@router.get("/trips/{driver_id}")
def get_driver_trips(
    driver_id: int,
    start_date: str = Query(...),
    end_date: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get trip history for a driver
    """
    if not MOTIVE_API_KEY:
        return {"trips": [], "message": "Motive API not configured"}
    
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    headers = {
        "Authorization": f"Bearer {MOTIVE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    params = {
        "start_date": start_date,
        "end_date": end_date
    }
    
    try:
        response = requests.get(
            f"{MOTIVE_API_BASE_URL}/drivers/{driver.external_id}/trips",
            headers=headers,
            params=params,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"trips": [], "error": response.text}
            
    except requests.exceptions.RequestException as e:
        return {"trips": [], "error": str(e)}


# ============================================================================
# IFTA REPORTING
# ============================================================================

@router.get("/ifta/mileage")
def get_ifta_mileage(
    start_date: str = Query(...),
    end_date: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get IFTA mileage report (miles by state)
    """
    if not MOTIVE_API_KEY:
        return {
            "states": [],
            "total_miles": 0,
            "message": "Motive API not configured"
        }
    
    headers = {
        "Authorization": f"Bearer {MOTIVE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    params = {
        "start_date": start_date,
        "end_date": end_date,
        "report_type": "ifta"
    }
    
    try:
        response = requests.get(
            f"{MOTIVE_API_BASE_URL}/reports/ifta",
            headers=headers,
            params=params,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "states": [],
                "total_miles": 0,
                "error": response.text
            }
            
    except requests.exceptions.RequestException as e:
        return {
            "states": [],
            "total_miles": 0,
            "error": str(e)
        }


# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@router.get("/status")
def get_motive_status(
    current_user: User = Depends(get_current_user)
):
    """
    Check Motive API connection status
    """
    if not MOTIVE_API_KEY:
        return {
            "configured": False,
            "message": "Motive API not configured. Set MOTIVE_API_KEY environment variable."
        }
    
    headers = {
        "Authorization": f"Bearer {MOTIVE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        # Test API connection
        response = requests.get(
            f"{MOTIVE_API_BASE_URL}/company",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            company_data = response.json()
            return {
                "configured": True,
                "connected": True,
                "company_name": company_data.get("name"),
                "message": "Motive ELD connected successfully"
            }
        else:
            return {
                "configured": True,
                "connected": False,
                "message": f"API error: {response.status_code}"
            }
            
    except requests.exceptions.RequestException as e:
        return {
            "configured": True,
            "connected": False,
            "message": f"Connection failed: {str(e)}"
        }


@router.post("/webhook")
def motive_webhook(
    webhook_data: dict,
    db: Session = Depends(get_db)
):
    """
    Receive webhooks from Motive (for real-time updates)
    """
    # Process webhook events
    event_type = webhook_data.get("event_type")
    
    if event_type == "hos_violation":
        # Handle HOS violation
        pass
    elif event_type == "location_update":
        # Handle location update
        pass
    elif event_type == "trip_completed":
        # Handle trip completion
        pass
    
    return {"success": True, "message": "Webhook received"}
