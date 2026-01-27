import asyncio
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Tuple

from app.core.database import get_db
from app.core.security import verify_token
from app.models.models import Tenant, Load, LoadStatus, PODSubmission, PODFile, PODStatus, AuditLog, Driver, Role
from app.schemas import PODSubmitRequest, LoadCreate, LoadUpdate, LoadResponse, AssignDriverRequest
from app.api.tenant import verify_tenant_scope
from app.services.dropbox_service import DropboxService
from app.services.airtable_service import AirtableRateConfService
from app.services.pdf_service import PDFService
from app.services.zip_service import ZipService
from app.services.email_service import EmailService

router = APIRouter(prefix="/tenant", tags=["tenant"])


async def require_dispatch_access(
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db),
) -> Tuple[dict, int]:
    tenant_id = await verify_tenant_scope(token)
    if token.get("role") not in [
        Role.TENANT_ADMIN.value,
        Role.PLATFORM_OWNER.value,
        Role.DISPATCHER.value,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dispatcher or tenant admin access required",
        )
    return token, tenant_id


@router.get("/loads", response_model=List[LoadResponse])
async def list_loads(
    auth: Tuple = Depends(require_dispatch_access),
    db: Session = Depends(get_db),
):
    token, tenant_id = auth
    loads = (
        db.query(Load)
        .filter(Load.tenant_id == tenant_id)
        .order_by(Load.id.desc())
        .all()
    )
    return [LoadResponse.model_validate(l) for l in loads]


@router.post("/loads", response_model=LoadResponse)
async def create_load(
    request: LoadCreate,
    auth: Tuple = Depends(require_dispatch_access),
    db: Session = Depends(get_db),
):
    token, tenant_id = auth

    existing = (
        db.query(Load)
        .filter(Load.tenant_id == tenant_id, Load.load_number == request.load_number)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Load number already exists",
        )

    load = Load(
        tenant_id=tenant_id,
        load_number=request.load_number,
        pickup_location=request.pickup_location,
        pickup_date=request.pickup_date,
        delivery_location=request.delivery_location,
        delivery_date=request.delivery_date,
        broker_name=request.broker_name,
        broker_phone=request.broker_phone,
        broker_email=request.broker_email,
        carrier=request.carrier,
        truck_number=request.truck_number,
        trailer_number=request.trailer_number,
        notes=request.notes,
        status=LoadStatus.CREATED.value,
    )
    db.add(load)
    db.commit()
    db.refresh(load)

    db.add(
        AuditLog(
            tenant_id=tenant_id,
            user_id=token["user_id"],
            action="created",
            resource_type="load",
            resource_id=load.id,
            details={"load_number": load.load_number},
        )
    )
    db.commit()

    return LoadResponse.model_validate(load)


@router.get("/loads/{load_id}", response_model=LoadResponse)
async def get_load(
    load_id: int,
    auth: Tuple = Depends(require_dispatch_access),
    db: Session = Depends(get_db),
):
    _, tenant_id = auth
    load = (
        db.query(Load)
        .filter(Load.id == load_id, Load.tenant_id == tenant_id)
        .first()
    )
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    return LoadResponse.model_validate(load)


@router.put("/loads/{load_id}", response_model=LoadResponse)
async def update_load(
    load_id: int,
    request: LoadUpdate,
    auth: Tuple = Depends(require_dispatch_access),
    db: Session = Depends(get_db),
):
    token, tenant_id = auth
    load = (
        db.query(Load)
        .filter(Load.id == load_id, Load.tenant_id == tenant_id)
        .first()
    )
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(load, key, value)

    db.add(load)
    db.commit()
    db.refresh(load)

    db.add(
        AuditLog(
            tenant_id=tenant_id,
            user_id=token["user_id"],
            action="updated",
            resource_type="load",
            resource_id=load.id,
            details={"load_number": load.load_number},
        )
    )
    db.commit()

    return LoadResponse.model_validate(load)


@router.post("/loads/{load_id}/assign", response_model=LoadResponse)
async def assign_driver(
    load_id: int,
    request: AssignDriverRequest,
    auth: Tuple = Depends(require_dispatch_access),
    db: Session = Depends(get_db),
):
    token, tenant_id = auth
    load = (
        db.query(Load)
        .filter(Load.id == load_id, Load.tenant_id == tenant_id)
        .first()
    )
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    driver = (
        db.query(Driver)
        .filter(Driver.id == request.driver_id, Driver.tenant_id == tenant_id)
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    load.driver_id = driver.id
    if load.status == LoadStatus.CREATED.value:
        load.status = LoadStatus.ASSIGNED.value

    db.add(load)
    db.commit()
    db.refresh(load)

    db.add(
        AuditLog(
            tenant_id=tenant_id,
            user_id=token["user_id"],
            action="assigned",
            resource_type="load",
            resource_id=load.id,
            details={"driver_id": driver.id},
        )
    )
    db.commit()

    return LoadResponse.model_validate(load)


@router.post("/loads/{load_id}/pod/submit")
async def submit_pod(
    load_id: int,
    request: str = Form(...),                 # JSON string in multipart
    files: List[UploadFile] = File(...),
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Submit POD with files."""
    tenant_id = await verify_tenant_scope(token)

    # Parse JSON string into PODSubmitRequest
    try:
        pod_req = PODSubmitRequest.model_validate_json(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid request JSON: {e}"
        )

    load = db.query(Load).filter(
        Load.id == load_id,
        Load.tenant_id == tenant_id
    ).first()

    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Create POD record
    pod = PODSubmission(
        load_id=load_id,
        receiver_name=pod_req.receiver_name,
        receiver_signature=pod_req.receiver_signature,
        delivery_date=pod_req.delivery_date,
        delivery_notes=pod_req.delivery_notes,
        status=PODStatus.SUBMITTED.value
    )
    db.add(pod)
    db.flush()  # assigns pod.id

    try:
        dropbox_service = DropboxService()

        base_path = f"/{tenant.slug}/POD Packets/{load.load_number}"
        dropbox_service.create_folder(f"{base_path}/Signed BOL")
        dropbox_service.create_folder(f"{base_path}/Delivery Photos")
        dropbox_service.create_folder(f"{base_path}/Generated POD")

        bol_files = []
        photo_files = []
        bol_preview_data = None
        photo_preview_data = None

        for uploaded_file in files:
            content = await uploaded_file.read()

            is_bol = uploaded_file.filename.lower().startswith("bol")
            if is_bol:
                dropbox_path = f"{base_path}/Signed BOL/{uploaded_file.filename}"
                bol_files.append((uploaded_file.filename, content))
                if bol_preview_data is None:
                    bol_preview_data = content
            else:
                dropbox_path = f"{base_path}/Delivery Photos/{uploaded_file.filename}"
                photo_files.append((uploaded_file.filename, content))
                if photo_preview_data is None:
                    photo_preview_data = content

            dropbox_service.upload_file(content, dropbox_path)

            db.add(PODFile(
                pod_id=pod.id,
                file_type="bol" if is_bol else "delivery_photo",
                filename=uploaded_file.filename,
                dropbox_path=dropbox_path
            ))

        # ZIP photos
        if photo_files:
            zip_content = ZipService.create_zip_from_files(photo_files)
            photos_zip_path = f"{base_path}/Delivery Photos/{load.load_number}_delivery_photos.zip"
            dropbox_service.upload_file(zip_content, photos_zip_path)
            pod.photos_zip_link = dropbox_service.create_shared_link(photos_zip_path)

        # Link first BOL file (or you can link folder later)
        if bol_files:
            bol_first_path = f"{base_path}/Signed BOL/{bol_files[0][0]}"
            pod.bol_folder_link = dropbox_service.create_shared_link(bol_first_path)

        # Generate PDF
        pdf_service = PDFService()
        pdf_bytes = await pdf_service.generate_pod_pdf(
            load_data={
                "id": load.id,
                "load_number": load.load_number,
                "pickup_location": load.pickup_location,
                "delivery_location": load.delivery_location,
                "broker_name": load.broker_name,
                "broker_phone": load.broker_phone,
                "broker_email": load.broker_email
            },
            pod_data={
                "receiver_name": pod_req.receiver_name,
                "receiver_signature": pod_req.receiver_signature,
                "delivery_date": pod_req.delivery_date,
                "delivery_notes": pod_req.delivery_notes,
                "bol_folder_link": pod.bol_folder_link,
                "photos_zip_link": pod.photos_zip_link
            },
            company_data={
                "company_name": tenant.company_name,
                "address": tenant.address,
                "phone": tenant.phone
            },
            bol_image_data=bol_preview_data,
            photo_image_data=photo_preview_data
        )

        pdf_path = f"{base_path}/Generated POD/POD_{load.load_number}.pdf"
        dropbox_service.upload_file(pdf_bytes, pdf_path)
        pod.pdf_link = dropbox_service.create_shared_link(pdf_path)

        # Update load status
        load.status = LoadStatus.DELIVERED.value

        # Audit log
        db.add(AuditLog(
            tenant_id=tenant_id,
            user_id=token["user_id"],
            action="submitted",
            resource_type="pod",
            resource_id=pod.id,
            details={"load_id": load.id}
        ))

        db.commit()

        # Email (optional)
        if load.broker_email:
            EmailService.send_pod_notification(
                load.broker_email,
                load.load_number,
                pod_req.receiver_name,
                pod.pdf_link
            )

        return {"message": "POD submitted successfully", "pod_id": pod.id, "pdf_link": pod.pdf_link}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process POD: {e}")


@router.post("/loads/extract-rate-confirmation")
async def extract_rate_confirmation(
    file: UploadFile = File(...),
    auth: Tuple = Depends(require_dispatch_access),
    db: Session = Depends(get_db),
):
    token, tenant_id = auth

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    try:
        dropbox_service = DropboxService()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Dropbox not configured: {e}")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=422, detail="Rate confirmation must be a PDF")

    content = await file.read()
    base_path = f"/{tenant.slug}/Rate Confirmations"
    dropbox_service.create_folder(base_path)
    dropbox_path = f"{base_path}/{file.filename}"
    dropbox_service.upload_file(content, dropbox_path)
    shared_link = dropbox_service.create_shared_link(dropbox_path)

    try:
        airtable = AirtableRateConfService()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Airtable not configured: {e}")

    record_id = airtable.create_record_with_attachment(shared_link, file.filename)
    extracted, _raw = await asyncio.to_thread(airtable.poll_for_extracted_fields, record_id)

    db.add(
        AuditLog(
            tenant_id=tenant_id,
            user_id=token["user_id"],
            action="uploaded",
            resource_type="rate_confirmation",
            details={"record_id": record_id, "filename": file.filename},
        )
    )
    db.commit()

    return {
        "record_id": record_id,
        "dropbox_link": shared_link,
        "extracted": extracted,
    }
