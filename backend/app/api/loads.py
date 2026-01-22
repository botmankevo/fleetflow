from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Load
from app.schemas.schemas import LoadCreate, LoadOut
from app.utils.deps import get_current_user, require_roles
from app.services.audit_service import log_event

router = APIRouter(prefix="/loads", tags=["loads"])


@router.post("", response_model=LoadOut)
def create_load(payload: LoadCreate, db: Session = Depends(get_db), user=Depends(require_roles("admin", "dispatcher"))):
    load = Load(**payload.model_dump())
    db.add(load)
    db.commit()
    db.refresh(load)
    log_event(db, user.id, "load_created", "load", load.id, {"load_id": load.load_id})
    return load


@router.get("", response_model=list[LoadOut])
def list_loads(db: Session = Depends(get_db), user=Depends(get_current_user)):
    query = db.query(Load)
    if user.role == "driver":
        query = query.filter(Load.assigned_driver_id == user.id)
    return query.all()


@router.get("/{load_id}", response_model=LoadOut)
def get_load(load_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if user.role == "driver" and load.assigned_driver_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return load


@router.put("/{load_id}", response_model=LoadOut)
def update_load(load_id: int, payload: LoadCreate, db: Session = Depends(get_db), user=Depends(require_roles("admin", "dispatcher"))):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    for key, value in payload.model_dump().items():
        setattr(load, key, value)
    db.commit()
    db.refresh(load)
    log_event(db, user.id, "load_updated", "load", load.id, {"load_id": load.load_id})
    return load


@router.post("/{load_id}/assign/{driver_id}", response_model=LoadOut)
def assign_driver(load_id: int, driver_id: int, db: Session = Depends(get_db), user=Depends(require_roles("admin", "dispatcher"))):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    load.assigned_driver_id = driver_id
    load.status = "assigned"
    db.commit()
    db.refresh(load)
    log_event(db, user.id, "load_assigned", "load", load.id, {"driver_id": driver_id})
    return load
