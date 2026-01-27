import io
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional
from app.core.security import verify_token
from app.core.config import settings
from app.services.dropbox import DropboxService
from app.services.scanning import scan_images_to_pdf

router = APIRouter(prefix="/pod", tags=["pod"])


@router.post("/upload")
def upload_pod(
    load_id: str = Form(...),
    files: List[UploadFile] = File(...),
    signature: Optional[UploadFile] = File(None),
    token: dict = verify_token,
):
    carrier_record_id = token.get("carrier_record_id")
    if not carrier_record_id:
        raise HTTPException(status_code=400, detail="Missing carrier_record_id")

    dropbox = DropboxService()
    base_path = f"{settings.DROPBOX_ROOT_FOLDER}/{carrier_record_id}/loads/{load_id}/POD"

    upload_items = []
    for f in files:
        upload_items.append((f.filename, f.file.read()))

    links = dropbox.upload_files(upload_items, base_path)

    signature_link = None
    if signature:
        sig_path = f"{base_path}/signature.png"
        dropbox.upload_file(signature.file.read(), sig_path)
        signature_link = dropbox.create_shared_link(sig_path)

    return {"links": links, "signature_link": signature_link}


@router.post("/scan")
def scan_images(files: List[UploadFile] = File(...)):
    images = [f.file.read() for f in files]
    pdf_bytes = scan_images_to_pdf(images)
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="No images provided")
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf")
