from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app import models, schemas
from app.core.security import verify_token

router = APIRouter(prefix="/equipment", tags=["equipment"])

@router.get("/", response_model=List[schemas.equipment.Equipment])
def get_equipment(db: Session = Depends(get_db), token: dict = Depends(verify_token)):
    carrier_id = token.get("carrier_id")
    return db.query(models.Equipment).filter(models.Equipment.carrier_id == carrier_id).all()

@router.post("/", response_model=schemas.equipment.Equipment)
def create_equipment(equipment: schemas.equipment.EquipmentCreate, db: Session = Depends(get_db), token: dict = Depends(verify_token)):
    carrier_id = token.get("carrier_id")
    db_equipment = models.Equipment(
        **equipment.dict(),
        carrier_id=carrier_id
    )
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment
