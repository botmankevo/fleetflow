"""
Mapbox routing API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.services.mapbox import MapboxService, calculate_rate_per_mile, get_rate_color
from app.core.security import get_current_user

router = APIRouter(prefix="/mapbox", tags=["mapbox"])


class RouteRequest(BaseModel):
    addresses: List[str]


class GeocodeRequest(BaseModel):
    address: str


class AutocompleteRequest(BaseModel):
    query: str
    proximity_lon: Optional[float] = None
    proximity_lat: Optional[float] = None


class RatePerMileRequest(BaseModel):
    rate_amount: float
    total_miles: float


@router.post("/route")
def calculate_route(request: RouteRequest, current_user = Depends(get_current_user)):
    """
    Calculate truck route through multiple addresses
    """
    try:
        service = MapboxService()
        route_data = service.calculate_route_with_stops(request.addresses)
        return route_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate route: {str(e)}")


@router.post("/geocode")
def geocode_address(request: GeocodeRequest, current_user = Depends(get_current_user)):
    """
    Geocode a single address to coordinates
    """
    try:
        service = MapboxService()
        result = service.geocode_address(request.address)
        
        if not result:
            raise HTTPException(status_code=404, detail="Address not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geocoding failed: {str(e)}")


@router.post("/autocomplete")
def autocomplete_address(request: AutocompleteRequest, current_user = Depends(get_current_user)):
    """
    Get address autocomplete suggestions
    """
    try:
        service = MapboxService()
        
        proximity = None
        if request.proximity_lon is not None and request.proximity_lat is not None:
            proximity = (request.proximity_lon, request.proximity_lat)
        
        suggestions = service.autocomplete_address(request.query, proximity)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Autocomplete failed: {str(e)}")


@router.post("/rate-per-mile")
def calculate_rate_color(request: RatePerMileRequest):
    """
    Calculate rate per mile and get color code
    """
    rpm = calculate_rate_per_mile(request.rate_amount, request.total_miles)
    color = get_rate_color(rpm)
    
    return {
        "rate_per_mile": rpm,
        "color": color,
        "total_miles": request.total_miles,
        "rate_amount": request.rate_amount,
    }


@router.get("/health")
def mapbox_health():
    """Check if Mapbox service is configured"""
    try:
        service = MapboxService()
        return {"status": "configured", "service": "mapbox"}
    except ValueError as e:
        return {"status": "not_configured", "error": str(e)}
