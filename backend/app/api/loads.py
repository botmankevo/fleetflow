from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import verify_token
from app.models.models import Tenant, Load, LoadStatus, PODSubmission, PODFile, PODStatus, AuditLog, Driver
from app.schemas import LoadCreate, LoadUpdate, LoadResponse, AssignDriverRequest, PODSubmitRequest, PODResponse
from app.api.tenant import verify_tenant_admin, verify_tenant_scope
from app.services.dropbox_service import DropboxService
from app.services.pdf_service import PDFService
from app.services.zip_service import ZipService
from app.services.email_service import EmailService
import asyncio

router = APIRouter(prefix="/tenant", tags=["tenant"])


@router.post("/loads", response_model=LoadResponse)
async def create_load(
    request: LoadCreate,
    auth: tuple = Depends(verify_tenant_admin),
    db: Session = Depends(get_db)
):
    """Create a load."""
    token, tenant_id = auth
    
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
        notes=request.notes,
        status=LoadStatus.CREATED.value
    )
    
    db.add(load)
    db.commit()
    db.refresh(load)
    
    # Log audit
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=token["user_id"],
        action="created",
        resource_type="load",
        resource_id=load.id,
        details={"load_number": load.load_number}
    )
    db.add(audit)
    db.commit()
    
    return LoadResponse.model_validate(load)


@router.get("/loads", response_model=List[LoadResponse])
async def list_loads(
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """List loads (filtered by driver if driver role)."""
    tenant_id = await verify_tenant_scope(token)
    
    if token.get("role") == "driver":
        # Driver sees only their own loads
        driver = db.query(Driver).filter(
            Driver.user_id == token["user_id"]
        ).first()
        if driver:
            loads = db.query(Load).filter(
                Load.tenant_id == tenant_id,
                Load.driver_id == driver.id
            ).all()
        else:
            loads = []
    else:
        # Others see all tenant loads
        loads = db.query(Load).filter(Load.tenant_id == tenant_id).all()
    
    return [LoadResponse.model_validate(l) for l in loads]


@router.get("/loads/{load_id}", response_model=LoadResponse)
async def get_load(
    load_id: int,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get load details."""
    tenant_id = await verify_tenant_scope(token)
    
    load = db.query(Load).filter(
        Load.id == load_id,
        Load.tenant_id == tenant_id
    ).first()
    
    if not load:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Load not found"
        )
    
    return LoadResponse.model_validate(load)


@router.post("/loads/{load_id}/assign-driver")
async def assign_driver(
    load_id: int,
    request: AssignDriverRequest,
    auth: tuple = Depends(verify_tenant_admin),
    db: Session = Depends(get_db)
):
    """Assign a driver to a load."""
    token, tenant_id = auth
    
    load = db.query(Load).filter(
        Load.id == load_id,
        Load.tenant_id == tenant_id
    ).first()
    
    if not load:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Load not found"
        )
    
    driver = db.query(Driver).filter(
        Driver.id == request.driver_id,
        Driver.tenant_id == tenant_id
    ).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    
    load.driver_id = driver.id
    load.status = LoadStatus.ASSIGNED.value
    
    db.commit()
    db.refresh(load)
    
    # Log audit
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=token["user_id"],
        action="assigned",
        resource_type="load",
        resource_id=load.id,
        details={"driver_id": driver.id}
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Driver assigned", "load": LoadResponse.model_validate(load)}


@router.post("/loads/{load_id}/pod/submit")
async def submit_pod(
    load_id: int,
    request: PODSubmitRequest,
    files: List[UploadFile] = File(...),
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Submit POD with files."""
    tenant_id = await verify_tenant_scope(token)
    
    load = db.query(Load).filter(
        Load.id == load_id,
        Load.tenant_id == tenant_id
    ).first()
    
    if not load:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Load not found"
        )
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    
    # Create POD record
    pod = PODSubmission(
        load_id=load_id,
        receiver_name=request.receiver_name,
        receiver_signature=request.receiver_signature,
        delivery_date=request.delivery_date,
        delivery_notes=request.delivery_notes,
        status=PODStatus.SUBMITTED.value
    )
    
    db.add(pod)
    db.flush()  # Get POD ID
    
    # Upload files to Dropbox
    try:
        dropbox_service = DropboxService()
        
        # Create folder structure
        base_path = f"/{tenant.slug}/POD Packets/{load.load_number}"
        dropbox_service.create_folder(f"{base_path}/Signed BOL")
        dropbox_service.create_folder(f"{base_path}/Delivery Photos")
        
        bol_files = []
        photo_files = []
        bol_preview_data = None
        photo_preview_data = None
        
        # Process uploaded files
        for uploaded_file in files:
            content = await uploaded_file.read()
            
            if uploaded_file.filename.startswith("bol"):
                bol_path = f"{base_path}/Signed BOL/{uploaded_file.filename}"
                dropbox_service.upload_file(content, bol_path)
                bol_files.append((uploaded_file.filename, content))
                if not bol_preview_data:
                    bol_preview_data = content
            else:
                photo_path = f"{base_path}/Delivery Photos/{uploaded_file.filename}"
                dropbox_service.upload_file(content, photo_path)
                photo_files.append((uploaded_file.filename, content))
                if not photo_preview_data:
                    photo_preview_data = content
            
            # Save file record
            pod_file = PODFile(
                pod_id=pod.id,
                file_type="bol" if uploaded_file.filename.startswith("bol") else "delivery_photo",
                filename=uploaded_file.filename,
                dropbox_path=bol_path if uploaded_file.filename.startswith("bol") else photo_path
            )
            db.add(pod_file)
        
        # Generate ZIP of photos
        photos_zip_path = None
        if photo_files:
            zip_content = ZipService.create_zip_from_files(photo_files)
            photos_zip_path = f"{base_path}/Delivery Photos/{load.load_number}_delivery_photos.zip"
            dropbox_service.upload_file(zip_content, photos_zip_path)
            pod.photos_zip_link = dropbox_service.create_shared_link(photos_zip_path)
        
        # Create shared links for BOL folder
        if bol_files:
            bol_first = bol_files[0][0]
            bol_first_path = f"{base_path}/Signed BOL/{bol_first}"
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
                "receiver_name": request.receiver_name,
                "receiver_signature": request.receiver_signature,
                "delivery_date": request.delivery_date,
                "delivery_notes": request.delivery_notes,
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
        
        # Upload PDF
        pdf_path = f"{base_path}/Generated POD/POD_{load.load_number}.pdf"
        dropbox_service.create_folder(f"{base_path}/Generated POD")
        dropbox_service.upload_file(pdf_bytes, pdf_path)
        pod.pdf_link = dropbox_service.create_shared_link(pdf_path)
        
        # Update load status
        load.status = LoadStatus.DELIVERED.value
        
        db.commit()
        
        # Send notification email
        if load.broker_email:
            EmailService.send_pod_notification(
                load.broker_email,
                load.load_number,
                request.receiver_name,
                pod.pdf_link
            )
        
        # Log audit
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=token["user_id"],
            action="submitted",
            resource_type="pod",
            resource_id=pod.id,
            details={"load_id": load.id}
        )
        db.add(audit)
        db.commit()
        
        return {
            "message": "POD submitted successfully",
            "pod_id": pod.id,
            "pdf_link": pod.pdf_link
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process POD: {str(e)}"
        )


@router.get("/loads/{load_id}/pod", response_model=PODResponse)
async def get_pod(
    load_id: int,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get POD details for a load."""
    tenant_id = await verify_tenant_scope(token)
    
    load = db.query(Load).filter(
        Load.id == load_id,
        Load.tenant_id == tenant_id
    ).first()
    
    if not load:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Load not found"
        )
    
    pod = db.query(PODSubmission).filter(PODSubmission.load_id == load_id).first()
    
    if not pod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="POD not found"
        )
    
    return PODResponse.model_validate(pod)
