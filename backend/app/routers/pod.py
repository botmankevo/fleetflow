import io
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.security import verify_token
from app.core.config import settings
from app.core.database import get_db
from app.services.dropbox import DropboxService
from app.services.scanning import scan_images_to_pdf
from app import models
from app.schemas.pod import PodHistoryItem

router = APIRouter(prefix="/pod", tags=["pod"])


@router.post("/upload")
def upload_pod(
    load_id: str = Form(...),
    files: List[UploadFile] = File(...),
    signature: Optional[UploadFile] = File(None),
    token: dict = verify_token,
    db: Session = Depends(get_db),
):
    carrier_id = token.get("carrier_id")
    user_id = token.get("user_id")
    if not carrier_id or not user_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id or user_id")

    try:
        load_id_int = int(load_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid load_id")

    load = db.query(models.Load).filter(models.Load.id == load_id_int, models.Load.carrier_id == carrier_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if token.get("role") == "driver" and token.get("driver_id") and load.driver_id != token.get("driver_id"):
        raise HTTPException(status_code=403, detail="Access denied")

    dropbox = DropboxService()
    base_path = f"{settings.DROPBOX_ROOT_FOLDER}/{carrier_id}/loads/{load_id}/POD"

    upload_items = []
    for f in files:
        upload_items.append((f.filename, f.file.read()))

    links = dropbox.upload_files(upload_items, base_path)

    signature_link = None
    if signature:
        sig_path = f"{base_path}/signature.png"
        dropbox.upload_file(signature.file.read(), sig_path)
        signature_link = dropbox.create_shared_link(sig_path)

    pod_record = models.PodRecord(
        load_id=load_id_int,
        uploaded_by_user_id=user_id,
        file_links=links,
        signature_link=signature_link,
    )
    db.add(pod_record)
    db.commit()

    return {"links": links, "signature_link": signature_link}


@router.post("/scan")
def scan_images(files: List[UploadFile] = File(...)):
    images = [f.file.read() for f in files]
    pdf_bytes = scan_images_to_pdf(images)
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="No images provided")
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf")


@router.get("/history", response_model=list[PodHistoryItem])
def pod_history(token: dict = verify_token, db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    user_id = token.get("user_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    query = db.query(models.PodRecord, models.Load, models.User).join(
        models.Load, models.PodRecord.load_id == models.Load.id
    ).join(
        models.User, models.PodRecord.uploaded_by_user_id == models.User.id
    ).filter(models.Load.carrier_id == carrier_id)
    if token.get("role") == "driver" and user_id:
        query = query.filter(models.PodRecord.uploaded_by_user_id == user_id)
    rows = query.order_by(models.PodRecord.created_at.desc()).all()
    results = []
    for pod, load, user in rows:
        results.append({
            "id": pod.id,
            "load_id": pod.load_id,
            "load_number": load.load_number,
            "uploaded_by_email": user.email,
            "file_links": pod.file_links or [],
            "signature_link": pod.signature_link,
            "created_at": pod.created_at.isoformat() if pod.created_at else "",
        })
    return results
