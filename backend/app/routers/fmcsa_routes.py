"""
FMCSA broker verification API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from app.services.fmcsa import FMCSAService
from app.core.security import get_current_user

router = APIRouter(prefix="/fmcsa", tags=["fmcsa"])


class BrokerLookupRequest(BaseModel):
    mc_number: Optional[str] = None
    dot_number: Optional[str] = None
    name: Optional[str] = None


@router.post("/verify-broker")
def verify_broker(request: BrokerLookupRequest, current_user = Depends(get_current_user)):
    """
    Verify broker credentials using MC, DOT, or company name
    """
    if not any([request.mc_number, request.dot_number, request.name]):
        raise HTTPException(
            status_code=400,
            detail="At least one of mc_number, dot_number, or name is required"
        )
    
    try:
        service = FMCSAService()
        result = service.verify_broker(
            mc_number=request.mc_number,
            dot_number=request.dot_number,
            name=request.name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FMCSA lookup failed: {str(e)}")


@router.get("/lookup/mc/{mc_number}")
def lookup_by_mc(mc_number: str, current_user = Depends(get_current_user)):
    """
    Look up carrier/broker by MC number
    """
    try:
        service = FMCSAService()
        result = service.lookup_by_mc_number(mc_number)
        
        if not result:
            raise HTTPException(status_code=404, detail="MC number not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FMCSA lookup failed: {str(e)}")


@router.get("/lookup/dot/{dot_number}")
def lookup_by_dot(dot_number: str, current_user = Depends(get_current_user)):
    """
    Look up carrier/broker by DOT number
    """
    try:
        service = FMCSAService()
        result = service.lookup_by_dot_number(dot_number)
        
        if not result:
            raise HTTPException(status_code=404, detail="DOT number not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FMCSA lookup failed: {str(e)}")


@router.get("/lookup/name/{name}")
def lookup_by_name(name: str, current_user = Depends(get_current_user)):
    """
    Search carrier/broker by company name
    """
    try:
        service = FMCSAService()
        result = service.lookup_by_name(name)
        
        if not result:
            raise HTTPException(status_code=404, detail="Company name not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FMCSA lookup failed: {str(e)}")
