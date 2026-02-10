"""
Document upload and management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import os
import uuid

from app.core.database import get_db
from app.core.security import verify_token
from app.models import Load, DocumentExchange, Driver
from pydantic import BaseModel


router = APIRouter(prefix="/document-uploads", tags=["document-uploads"])


class DocumentApprovalRequest(BaseModel):
    status: str  # "Accepted" or "Rejected"
    notes: Optional[str] = None


@router.post("/loads/{load_id}/upload")
async def upload_load_document(
    load_id: int,
    doc_type: str = Form(...),  # RC, BOL, POD, INV, RCP, OTH
    file: UploadFile = File(...),
    driver_id: Optional[int] = Form(None),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """
    Upload a document for a load
    - Drivers can upload documents (goes to docs_exchange for approval)
    - Admins can directly attach documents to loads
    """
    carrier_id = token.get("carrier_id")
    role = token.get("role")
    user_id = token.get("user_id")
    
    # Verify load exists
    load = db.query(Load).filter(Load.id == load_id, Load.carrier_id == carrier_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    # Map short doc type to full name
    doc_type_map = {
        "RC": "Rate Confirmation",
        "BOL": "Bill of Lading",
        "POD": "Proof of Delivery",
        "INV": "Invoice",
        "RCP": "Receipt",
        "OTH": "Other"
    }
    
    doc_type_full = doc_type_map.get(doc_type, doc_type)
    
    # TODO: Save file to storage (Dropbox, S3, etc.)
    # For now, simulate file storage
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_url = f"/uploads/loads/{load_id}/{doc_type.lower()}_{unique_filename}"
    
    # Determine driver_id
    upload_driver_id = driver_id
    if role == "driver" and token.get("driver_id"):
        upload_driver_id = token.get("driver_id")
    
    # If admin, directly attach to load
    if role in ["admin", "dispatcher"]:
        # Map doc type to load column
        doc_column_map = {
            "RC": "rc_document",
            "BOL": "bol_document",
            "POD": "pod_document",
            "INV": "invoice_document",
            "RCP": "receipt_document",
            "OTH": "other_document"
        }
        
        column_name = doc_column_map.get(doc_type)
        if column_name:
            setattr(load, column_name, file_url)
            db.commit()
            
            return {
                "success": True,
                "message": f"{doc_type_full} uploaded and attached to load",
                "file_url": file_url,
                "status": "Approved"
            }
    
    # If driver or needs approval, create DocumentExchange entry
    if not upload_driver_id:
        raise HTTPException(status_code=400, detail="Driver ID required for driver uploads")
    
    doc_exchange = DocumentExchange(
        carrier_id=carrier_id,
        load_id=load_id,
        driver_id=upload_driver_id,
        uploaded_by_user_id=user_id,
        doc_type=doc_type_full,
        attachment_url=file_url,
        status="Pending",
        notes=notes,
        created_at=datetime.utcnow()
    )
    
    db.add(doc_exchange)
    db.commit()
    db.refresh(doc_exchange)
    
    return {
        "success": True,
        "message": f"{doc_type_full} uploaded and pending approval",
        "document_id": doc_exchange.id,
        "file_url": file_url,
        "status": "Pending"
    }


@router.get("/loads/{load_id}/pending")
def get_pending_documents(
    load_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Get pending documents for a specific load"""
    carrier_id = token.get("carrier_id")
    documents = db.query(DocumentExchange).filter(
        DocumentExchange.load_id == load_id,
        DocumentExchange.carrier_id == carrier_id,
        DocumentExchange.status == "Pending"
    ).all()
    
    return [{
        "id": doc.id,
        "doc_type": doc.doc_type,
        "attachment_url": doc.attachment_url,
        "driver_id": doc.driver_id,
        "uploaded_by": doc.uploaded_by_user_id,
        "notes": doc.notes,
        "created_at": doc.created_at.isoformat()
    } for doc in documents]


@router.get("/pending")
def get_all_pending_documents(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """
    Get all pending documents for the carrier
    Admin/dispatcher view
    """
    role = token.get("role")
    carrier_id = token.get("carrier_id")
    
    if role not in ["admin", "dispatcher"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    documents = db.query(DocumentExchange).filter(
        DocumentExchange.carrier_id == carrier_id,
        DocumentExchange.status == "Pending"
    ).order_by(DocumentExchange.created_at.desc()).all()
    
    result = []
    for doc in documents:
        load = db.query(Load).filter(Load.id == doc.load_id).first()
        driver = db.query(Driver).filter(Driver.id == doc.driver_id).first()
        
        result.append({
            "id": doc.id,
            "load_id": doc.load_id,
            "load_number": load.load_number if load else "Unknown",
            "driver_id": doc.driver_id,
            "driver_name": driver.name if driver else "Unknown",
            "doc_type": doc.doc_type,
            "attachment_url": doc.attachment_url,
            "notes": doc.notes,
            "created_at": doc.created_at.isoformat()
        })
    
    return result


@router.post("/{document_id}/approve")
def approve_document(
    document_id: int,
    request: DocumentApprovalRequest,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Approve or reject a pending document - Admin only"""
    role = token.get("role")
    carrier_id = token.get("carrier_id")
    user_id = token.get("user_id")
    
    if role not in ["admin", "dispatcher"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    doc_exchange = db.query(DocumentExchange).filter(
        DocumentExchange.id == document_id,
        DocumentExchange.carrier_id == carrier_id
    ).first()
    
    if not doc_exchange:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc_exchange.status = request.status
    doc_exchange.reviewed_by_user_id = user_id
    doc_exchange.reviewed_at = datetime.utcnow()
    if request.notes:
        doc_exchange.notes = request.notes
    
    # If approved, attach to load
    if request.status == "Accepted":
        load = db.query(Load).filter(Load.id == doc_exchange.load_id).first()
        if load:
            doc_type_map = {
                "Rate Confirmation": "rc_document",
                "Bill of Lading": "bol_document",
                "Proof of Delivery": "pod_document",
                "Invoice": "invoice_document",
                "Receipt": "receipt_document",
                "Other": "other_document"
            }
            
            column_name = doc_type_map.get(doc_exchange.doc_type)
            if column_name:
                setattr(load, column_name, doc_exchange.attachment_url)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Document {request.status.lower()}",
        "document_id": document_id,
        "status": request.status
    }


@router.post("/{document_id}/reassign/{new_load_id}")
def reassign_document_to_load(
    document_id: int,
    new_load_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    """Reassign a document to a different load - Admin only"""
    role = token.get("role")
    carrier_id = token.get("carrier_id")
    
    if role not in ["admin", "dispatcher"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    doc_exchange = db.query(DocumentExchange).filter(
        DocumentExchange.id == document_id,
        DocumentExchange.carrier_id == carrier_id
    ).first()
    
    if not doc_exchange:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Verify new load exists
    new_load = db.query(Load).filter(
        Load.id == new_load_id,
        Load.carrier_id == carrier_id
    ).first()
    
    if not new_load:
        raise HTTPException(status_code=404, detail="New load not found")
    
    old_load_id = doc_exchange.load_id
    doc_exchange.load_id = new_load_id
    db.commit()
    
    return {
        "success": True,
        "message": f"Document reassigned from load {old_load_id} to {new_load_id}",
        "document_id": document_id,
        "old_load_id": old_load_id,
        "new_load_id": new_load_id
    }
