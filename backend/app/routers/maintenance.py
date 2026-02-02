from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from sqlalchemy.orm import Session
from app.core.security import verify_token
from app.core.database import get_db
from app.core.config import settings
from app.services.dropbox import DropboxService
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse
from app import models

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.get("", response_model=list[MaintenanceResponse])
def list_maintenance(token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    if token.get("role") == "driver":
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(models.Maintenance).filter(models.Maintenance.carrier_id == carrier_id).all()


@router.post("", response_model=MaintenanceResponse)
def create_maintenance(payload: MaintenanceCreate, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    if token.get("role") == "driver":
        raise HTTPException(status_code=403, detail="Access denied")
    record = models.Maintenance(
        carrier_id=carrier_id,
        unit=payload.unit,
        description=payload.description,
        cost=payload.cost,
        occurred_at=payload.occurred_at,
        receipt_link=payload.receipt_link,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.patch("/{maintenance_id}", response_model=MaintenanceResponse)
def update_maintenance(maintenance_id: int, payload: MaintenanceUpdate, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    if token.get("role") == "driver":
        raise HTTPException(status_code=403, detail="Access denied")
    record = db.query(models.Maintenance).filter(
        models.Maintenance.id == maintenance_id,
        models.Maintenance.carrier_id == carrier_id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.post("/{maintenance_id}/receipt")
def upload_receipt(maintenance_id: int, file: UploadFile = File(...), token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    if token.get("role") == "driver":
        raise HTTPException(status_code=403, detail="Access denied")
    record = db.query(models.Maintenance).filter(
        models.Maintenance.id == maintenance_id,
        models.Maintenance.carrier_id == carrier_id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    dropbox = DropboxService()
    base_path = f"{settings.DROPBOX_ROOT_FOLDER}/{carrier_id}/maintenance/{maintenance_id}"
    dropbox.upload_file(file.file.read(), f"{base_path}/{file.filename}")
    link = dropbox.create_shared_link(f"{base_path}/{file.filename}")
    record.receipt_link = link
    db.commit()
    return {"link": link}
