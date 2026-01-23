import mimetypes
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.models import PodSubmission, Load
from app.schemas.schemas import PodSubmissionOut
from app.utils.deps import require_roles
from app.services.dropbox_service import upload_file, create_shared_link
from app.services.airtable_service import AirtableClient
from app.core.config import settings
from app.services.pdf_service import generate_pod_packet, build_thumbnail_data_uri
from app.services.zip_service import build_zip
from app.services.audit_service import log_event
from app.services.email_service import send_email

router = APIRouter(prefix="/pods", tags=["pods"])


def is_image_upload(filename: str, content_type: str | None) -> bool:
    if content_type and content_type.startswith("image/"):
        return True
    guessed_type, _ = mimetypes.guess_type(filename)
    return bool(guessed_type and guessed_type.startswith("image/"))


@router.post("", response_model=PodSubmissionOut)
async def submit_pod(
    load_id: int = Form(...),
    receiver_name: str = Form(...),
    receiver_signature_typed: str = Form(...),
    delivery_notes: str = Form(""),
    send_receiver_copy: bool = Form(False),
    signed_bol: List[UploadFile] = File(...),
    delivery_photos: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    user=Depends(require_roles("driver")),
):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if load.assigned_driver_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    bol_files = []
    bol_zip_files = []
    for file in signed_bol:
        content = await file.read()
        bol_files.append(
            {"filename": file.filename, "content": content, "content_type": file.content_type}
        )
        bol_zip_files.append((file.filename, content))

    photo_files = []
    photo_zip_files = []
    for file in delivery_photos:
        content = await file.read()
        photo_files.append(
            {"filename": file.filename, "content": content, "content_type": file.content_type}
        )
        photo_zip_files.append((file.filename, content))

    bol_paths = []
    for bol_file in bol_files:
        filename = bol_file["filename"]
        content = bol_file["content"]
        path = f"/POD Packets/{load.load_id}/Signed BOL/{filename}"
        upload_file(path, content)
        bol_paths.append(path)

    photo_paths = []
    for photo_file in photo_files:
        filename = photo_file["filename"]
        content = photo_file["content"]
        path = f"/POD Packets/{load.load_id}/Delivery Photos/{filename}"
        upload_file(path, content)
        photo_paths.append(path)

    zip_bytes = build_zip(bol_zip_files + photo_zip_files)
    zip_path = f"/POD Packets/{load.load_id}/Delivery Photos/{load.load_id}_photos.zip"
    upload_file(zip_path, zip_bytes)
    zip_shared_link = create_shared_link(zip_path, allow_public=send_receiver_copy)

    bol_thumb = (
        build_thumbnail_data_uri(bol_files[0]["content"])
        if bol_files and is_image_upload(bol_files[0]["filename"], bol_files[0]["content_type"])
        else None
    )
    photo_thumb = (
        build_thumbnail_data_uri(photo_files[0]["content"])
        if photo_files
        and is_image_upload(photo_files[0]["filename"], photo_files[0]["content_type"])
        else None
    )

    pdf_payload = {
        "company": {
            "name": "Carrier Outgoing Xpress LLC dba Cox Transportation & Logistics",
            "address": "Houston, TX",
            "mc": "MC 1514835",
            "dot": "DOT 4018154",
            "dispatch_email": "Dispatch@CoxTNL.com",
            "phone": "(832) 840-2760",
        },
        "load_summary": {
            "load_id": load.load_id,
            "commodity": load.commodity,
            "status": load.status,
            "delivery_date": load.delivery_date,
        },
        "broker_info": load.broker_info_text,
        "locations": {
            "pickup": {"name": load.pickup_name, "address": load.pickup_address},
            "delivery": {"name": load.delivery_name, "address": load.delivery_address},
        },
        "receiver": {
            "name": receiver_name,
            "signature": receiver_signature_typed,
        },
        "notes": delivery_notes,
        "signed_bol": {
            "thumbnail": bol_thumb,
            "view_link": create_shared_link(bol_paths[0], allow_public=send_receiver_copy) if bol_paths else None,
            "view_all_link": zip_shared_link,
        },
        "delivery_photos": {
            "thumbnail": photo_thumb,
            "view_all_link": zip_shared_link,
        },
        "load_id": load.load_id,
        "share_public": send_receiver_copy,
    }

    pdf_result = await generate_pod_packet(pdf_payload)

    if settings.airtable_enabled:
        airtable = AirtableClient()
        airtable_fields = {
            "Load ID": load.load_id,
            "POD Packet Generated": True,
            "POD Packet Link Dropbox": zip_shared_link,
            "Submitted At": None,
        }
        airtable.upsert_record("POD Submissions", None, airtable_fields)

    submission = PodSubmission(
        load_id=load.id,
        driver_id=user.id,
        receiver_name=receiver_name,
        receiver_signature_typed=receiver_signature_typed,
        delivery_notes=delivery_notes,
        dropbox_signed_bol_paths=bol_paths,
        dropbox_delivery_photo_paths=photo_paths,
        dropbox_zip_path=zip_path,
        dropbox_zip_shared_link=zip_shared_link,
        dropbox_pod_packet_pdf_path=pdf_result["path"],
        dropbox_pod_packet_shared_link=pdf_result["shared_link"],
    )
    db.add(submission)
    load.status = "completed"
    db.commit()
    db.refresh(submission)

    log_event(db, user.id, "pod_submitted", "load", load.id, {"pod_id": submission.id})
    send_email(
        subject=f"POD Submitted: Load {load.load_id}",
        body=f"POD submission received for load {load.load_id}.",
        to_address="Dispatch@CoxTNL.com",
    )
    return submission
