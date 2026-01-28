from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.security import verify_token
from app.core.database import get_db
from app.schemas.drivers import DriverCreate, DriverUpdate, DriverResponse
from app import models

router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.get("", response_model=list[DriverResponse])
def list_drivers(token: dict = verify_token, db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    return db.query(models.Driver).filter(models.Driver.carrier_id == carrier_id).all()


@router.post("", response_model=DriverResponse)
def create_driver(payload: DriverCreate, token: dict = verify_token, db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    driver = models.Driver(
        carrier_id=carrier_id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.patch("/{driver_id}", response_model=DriverResponse)
def update_driver(driver_id: int, payload: DriverUpdate, token: dict = verify_token, db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id, models.Driver.carrier_id == carrier_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(driver, field, value)
    db.commit()
    db.refresh(driver)
    return driver
