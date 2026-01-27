from fastapi import APIRouter, HTTPException
from app.services.maps import get_route

router = APIRouter(prefix="/maps", tags=["maps"])


@router.get("/route")
def route(from_addr: str, to_addr: str):
    try:
        return get_route(from_addr, to_addr)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
