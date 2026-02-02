from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.security import verify_token
from app.core.database import get_db
from app.schemas.loads import LoadCreate, LoadUpdate, LoadResponse
from app import models

router = APIRouter(prefix="/loads", tags=["loads"])


@router.get("", response_model=list[LoadResponse])
def list_loads(token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    role = token.get("role")
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")

    query = db.query(models.Load).filter(models.Load.carrier_id == carrier_id)
    if role == "driver":
        if not token.get("driver_id"):
            return []
        query = query.filter(models.Load.driver_id == token.get("driver_id"))
    return query.order_by(models.Load.created_at.desc()).all()


@router.get("/{load_id}", response_model=LoadResponse)
def get_load(load_id: int, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")

    load = db.query(models.Load).filter(models.Load.id == load_id, models.Load.carrier_id == carrier_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if token.get("role") == "driver" and token.get("driver_id") and load.driver_id != token.get("driver_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    return load


@router.post("", response_model=LoadResponse)
def create_load(payload: LoadCreate, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")

    load = models.Load(
        carrier_id=carrier_id,
        driver_id=payload.driver_id,
        load_number=payload.load_number,
        status=payload.status,
        pickup_address=payload.pickup_address,
        delivery_address=payload.delivery_address,
        notes=payload.notes,
    )
    db.add(load)
    db.commit()
    db.refresh(load)
    return load


@router.patch("/{load_id}", response_model=LoadResponse)
def update_load(load_id: int, payload: LoadUpdate, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")

    load = db.query(models.Load).filter(models.Load.id == load_id, models.Load.carrier_id == carrier_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if token.get("role") == "driver" and token.get("driver_id") and load.driver_id != token.get("driver_id"):
        raise HTTPException(status_code=403, detail="Access denied")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(load, field, value)
    db.commit()
    db.refresh(load)
    return load
