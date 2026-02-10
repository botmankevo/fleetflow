from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.security import verify_token
from app.core.database import get_db
from app.schemas.drivers import DriverCreate, DriverUpdate, DriverResponse
from app import models

router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.post("/{driver_id}/documents/upload")
async def upload_driver_document(
    driver_id: int,
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    expires_at: str = Form(None),
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Upload a driver document (CDL, Medical Card, etc.) with optional expiration date.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Verify driver belongs to carrier
    driver = db.query(models.Driver).filter(
        models.Driver.id == driver_id,
        models.Driver.carrier_id == carrier_id
    ).first()
    
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Save file to storage (Dropbox or local)
    try:
        # For now, we'll create a placeholder URL
        # In production, this should upload to Dropbox or S3
        file_content = await file.read()
        
        # TODO: Implement actual file upload to Dropbox/S3
        attachment_url = f"/uploads/driver_docs/{driver_id}/{doc_type}_{file.filename}"
        
        # Check if document already exists for this driver and type
        existing_doc = db.query(models.DriverDocument).filter(
            models.DriverDocument.driver_id == driver_id,
            models.DriverDocument.doc_type == doc_type
        ).first()
        
        if existing_doc:
            # Update existing document
            existing_doc.status = "active"
            existing_doc.attachment_url = attachment_url
            if expires_at:
                existing_doc.expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            existing_doc.issued_at = datetime.utcnow()
        else:
            # Create new document record
            new_doc = models.DriverDocument(
                driver_id=driver_id,
                doc_type=doc_type,
                status="active",
                attachment_url=attachment_url,
                issued_at=datetime.utcnow(),
                expires_at=datetime.fromisoformat(expires_at.replace('Z', '+00:00')) if expires_at else None
            )
            db.add(new_doc)
        
        db.commit()
        
        return {"ok": True, "message": f"Document {doc_type} uploaded successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/{driver_id}/documents/expiring")
def get_expiring_documents(
    driver_id: int,
    days: int = 30,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Get documents that are expiring within the specified number of days.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Verify driver belongs to carrier
    driver = db.query(models.Driver).filter(
        models.Driver.id == driver_id,
        models.Driver.carrier_id == carrier_id
    ).first()
    
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    cutoff_date = datetime.utcnow() + timedelta(days=days)
    
    expiring_docs = db.query(models.DriverDocument).filter(
        models.DriverDocument.driver_id == driver_id,
        models.DriverDocument.expires_at.isnot(None),
        models.DriverDocument.expires_at <= cutoff_date,
        models.DriverDocument.expires_at >= datetime.utcnow()
    ).all()
    
    return {
        "driver_id": driver_id,
        "driver_name": driver.name,
        "expiring_count": len(expiring_docs),
        "documents": [
            {
                "id": doc.id,
                "doc_type": doc.doc_type,
                "expires_at": doc.expires_at.isoformat() if doc.expires_at else None,
                "days_remaining": (doc.expires_at - datetime.utcnow()).days if doc.expires_at else None
            }
            for doc in expiring_docs
        ]
    }


@router.get("/compliance/dashboard")
def get_compliance_dashboard(
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Get compliance dashboard showing all drivers with missing or expiring documents.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Get all drivers for carrier
    drivers = db.query(models.Driver).filter(
        models.Driver.carrier_id == carrier_id
    ).all()
    
    REQUIRED_DOCUMENTS = [
        "Application",
        "CDL",
        "Medical Card",
        "Drug Test",
        "MVR",
        "SSN Card",
        "Employment Verification",
        "Road Test",
        "Annual Review",
        "Clearinghouse Query"
    ]
    
    compliance_data = []
    total_missing = 0
    total_expiring = 0
    total_expired = 0
    
    for driver in drivers:
        driver_docs = {doc.doc_type: doc for doc in driver.documents}
        
        missing_docs = []
        expiring_docs = []
        expired_docs = []
        
        for doc_type in REQUIRED_DOCUMENTS:
            if doc_type not in driver_docs:
                missing_docs.append(doc_type)
            else:
                doc = driver_docs[doc_type]
                if doc.expires_at:
                    if doc.expires_at < datetime.utcnow():
                        expired_docs.append(doc_type)
                    elif doc.expires_at < datetime.utcnow() + timedelta(days=30):
                        expiring_docs.append(doc_type)
        
        if missing_docs or expiring_docs or expired_docs:
            compliance_data.append({
                "driver_id": driver.id,
                "driver_name": driver.name,
                "missing_documents": missing_docs,
                "expiring_documents": expiring_docs,
                "expired_documents": expired_docs,
                "compliance_score": ((len(REQUIRED_DOCUMENTS) - len(missing_docs) - len(expired_docs)) / len(REQUIRED_DOCUMENTS)) * 100
            })
        
        total_missing += len(missing_docs)
        total_expiring += len(expiring_docs)
        total_expired += len(expired_docs)
    
    return {
        "summary": {
            "total_drivers": len(drivers),
            "drivers_with_issues": len(compliance_data),
            "total_missing_documents": total_missing,
            "total_expiring_documents": total_expiring,
            "total_expired_documents": total_expired
        },
        "drivers": sorted(compliance_data, key=lambda x: x["compliance_score"])
    }


@router.get("", response_model=list[DriverResponse])
def list_drivers(token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    return db.query(models.Driver).filter(models.Driver.carrier_id == carrier_id).all()


@router.post("", response_model=DriverResponse)
def create_driver(payload: DriverCreate, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
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
def update_driver(driver_id: int, payload: DriverUpdate, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
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
