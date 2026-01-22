from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import Maintenance
from app.utils.deps import require_roles
from app.services.dropbox_service import upload_file

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.post("")
async def create_maintenance(
    vehicle_id: str = Form(...),
    type: str = Form(...),
    description: str = Form(""),
    cost: str = Form(""),
    date: str = Form(""),
    attachments: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "dispatcher")),
):
    paths = []
    for file in attachments:
        content = await file.read()
        path = f"/Maintenance/{vehicle_id}/{file.filename}"
        upload_file(path, content)
        paths.append(path)
    record = Maintenance(
        vehicle_id=vehicle_id,
        type=type,
        description=description,
        cost=cost,
        date=date,
        attachment_paths=paths,
        created_by=user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id, "attachment_paths": paths}
