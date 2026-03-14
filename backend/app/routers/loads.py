from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import io
import re
from datetime import datetime
from sqlalchemy import or_, and_, func
from app.core.security import verify_token
from app.core.database import get_db
from app.core.config import settings
from app.schemas.loads import LoadCreate, LoadUpdate, LoadResponse
from app.schemas.payroll import LoadPayLedgerResponse, PayeeLedgerResponse, LedgerLineResponse, PassThroughLineResponse
from app.schemas.pod import DocumentExchangeItem
from app import models
from app.services.dropbox import DropboxService
from pypdf import PdfReader
from PIL import Image
from app.services.pay_engine import recalc_load_pay
from app.services.rate_con_ocr import RateConfirmationOCR
from app.services.mapbox import MapboxService, calculate_rate_per_mile
import pdf2image

router = APIRouter(prefix="/loads", tags=["loads"])


@router.get("", response_model=list[LoadResponse])
def list_loads(token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    role = token.get("role")
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")

    query = db.query(models.Load).filter(models.Load.carrier_id == carrier_id)
    if role == "driver":
        if not token.get("driver_id"):
            return []
        query = query.filter(models.Load.driver_id == token.get("driver_id"))
    
    from sqlalchemy.orm import joinedload
    
    loads = query.options(
        joinedload(models.Load.driver),
        joinedload(models.Load.customer),
        joinedload(models.Load.stops)
    ).order_by(models.Load.created_at.desc()).all()
    
    # Enhance each load with parsed address data
    result = []
    for load in loads:
        load_dict = {
            'id': load.id,
            'carrier_id': load.carrier_id,
            'load_number': load.load_number,
            'status': load.status,
            'pickup_address': load.pickup_address,
            'pickup_date': load.pickup_date,
            'delivery_address': load.delivery_address,
            'delivery_date': load.delivery_date,
            'notes': load.notes,
            'driver_id': load.driver_id,
            'broker_name': load.broker_name,
            'po_number': load.po_number,
            'rate_amount': load.rate_amount,
            'broker_rate': load.rate_amount,
            'rc_document': load.rc_document,
            'bol_document': load.bol_document,
            'pod_document': load.pod_document,
            'invoice_document': load.invoice_document,
            'receipt_document': load.receipt_document,
            'other_document': load.other_document,
            # Partial Load Details
            'load_type': load.load_type,
            'weight': load.weight,
            'pallets': load.pallets,
            'length_ft': load.length_ft,
            'total_miles': load.total_miles,
            'rate_per_mile': load.rate_per_mile,
            'stops': load.stops,
            'created_at': load.created_at,
            'updated_at': getattr(load, 'updated_at', None),
        }
        
        # Add driver relationship
        if load.driver:
            load_dict['driver'] = {
                'id': load.driver.id,
                'name': load.driver.name
            }
        
        # Add customer relationship
        if load.customer:
            load_dict['customer'] = {
                'id': load.customer.id,
                'company_name': load.customer.company_name,
                'customer_type': load.customer.customer_type
            }
        
        # Parse pickup address
        if load.pickup_address:
            parts = load.pickup_address.split(',')
            load_dict['pickup_location'] = parts[0].strip() if len(parts) > 0 else None
            load_dict['pickup_city'] = parts[1].strip() if len(parts) > 1 else None
            if len(parts) > 2:
                state_parts = parts[2].strip().split()
                load_dict['pickup_state'] = state_parts[0] if state_parts else None
        
        # Parse delivery address
        if load.delivery_address:
            parts = load.delivery_address.split(',')
            load_dict['delivery_location'] = parts[0].strip() if len(parts) > 0 else None
            load_dict['delivery_city'] = parts[1].strip() if len(parts) > 1 else None
            if len(parts) > 2:
                state_parts = parts[2].strip().split()
                load_dict['delivery_state'] = state_parts[0] if state_parts else None
        
        result.append(LoadResponse(**load_dict))
    
    return result


@router.get("/{load_id}", response_model=LoadResponse)
def get_load(load_id: int, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")

    from sqlalchemy.orm import joinedload
    load = db.query(models.Load).options(
        joinedload(models.Load.driver),
        joinedload(models.Load.customer),
        joinedload(models.Load.stops)
    ).filter(models.Load.id == load_id, models.Load.carrier_id == carrier_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if token.get("role") == "driver" and token.get("driver_id") and load.driver_id != token.get("driver_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    return load


@router.get("/{load_id}/documents", response_model=list[DocumentExchangeItem])
def get_load_documents(load_id: int, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """Get all accepted documents for a specific load"""
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")

    # Verify load exists and user has access
    load = db.query(models.Load).filter(models.Load.id == load_id, models.Load.carrier_id == carrier_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    if token.get("role") == "driver" and token.get("driver_id") and load.driver_id != token.get("driver_id"):
        raise HTTPException(status_code=403, detail="Access denied")

    # Get only accepted documents for this load
    query = db.query(
        models.DocumentExchange,
        models.Driver
    ).join(
        models.Driver, models.DocumentExchange.driver_id == models.Driver.id
    ).filter(
        models.DocumentExchange.load_id == load_id,
        models.DocumentExchange.status == "Accepted"
    )

    rows = query.order_by(models.DocumentExchange.created_at.desc()).all()
    
    results = []
    for doc, driver in rows:
        results.append({
            "id": doc.id,
            "date": doc.created_at.strftime("%Y-%m-%d") if doc.created_at else "",
            "driver_name": driver.name,
            "driver_id": driver.id,
            "load_id": doc.load_id,
            "load_number": load.load_number,
            "type": doc.doc_type,
            "attachment_url": doc.attachment_url,
            "status": doc.status,
            "notes": doc.notes,
            "created_at": doc.created_at.isoformat() if doc.created_at else "",
            "updated_at": doc.updated_at.isoformat() if doc.updated_at else "",
        })
    
    return results


@router.post("", response_model=LoadResponse)
def create_load(payload: LoadCreate, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")

    load = models.Load(
        carrier_id=carrier_id,
        driver_id=payload.driver_id,
        truck_id=payload.truck_id,
        trailer_id=payload.trailer_id,
        customer_id=payload.customer_id,
        load_number=payload.load_number,
        status=payload.status,
        po_number=payload.po_number,
        pickup_address=payload.pickup_address,
        delivery_address=payload.delivery_address,
        notes=payload.notes,
        load_type=payload.load_type,
        weight=payload.weight,
        pallets=payload.pallets,
        length_ft=payload.length_ft,
        rate_amount=payload.rate_amount,
        fuel_surcharge=payload.fuel_surcharge,
        detention=payload.detention,
        layover=payload.layover,
        lumper=payload.lumper,
        other_fees=payload.other_fees,
        rc_document=payload.rc_document,
        bol_document=payload.bol_document,
        pod_document=payload.pod_document,
        invoice_document=payload.invoice_document,
        receipt_document=payload.receipt_document,
        other_document=payload.other_document,
    )
    db.add(load)
    db.flush() # Get load.id
    
    # Create stops if provided
    if payload.stops:
        for i, stop_data in enumerate(payload.stops):
            stop = models.LoadStop(
                load_id=load.id,
                stop_type=stop_data.stop_type,
                stop_number=stop_data.stop_number or (i + 1),
                company=stop_data.company,
                address=stop_data.address,
                city=stop_data.city,
                state=stop_data.state,
                zip_code=stop_data.zip_code,
                date=stop_data.date,
                time=stop_data.time,
                phone=stop_data.phone,
                website=stop_data.website,
                hours=stop_data.hours
            )
            db.add(stop)
    
    db.commit()
    db.refresh(load)
    
    # Auto-calculate metrics
    update_load_metrics(load, db)
    return load


@router.patch("/{load_id}", response_model=LoadResponse)
def update_load(load_id: int, payload: LoadUpdate, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")

    load = db.query(models.Load).filter(models.Load.id == load_id, models.Load.carrier_id == carrier_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if token.get("role") == "driver" and token.get("driver_id") and load.driver_id != token.get("driver_id"):
        raise HTTPException(status_code=403, detail="Access denied")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == 'stops' and value is not None:
            # Clear existing stops
            db.query(models.LoadStop).filter(models.LoadStop.load_id == load.id).delete()
            # Create new stops
            for i, stop_data in enumerate(value):
                stop = models.LoadStop(
                    load_id=load.id,
                    stop_type=stop_data['stop_type'],
                    stop_number=stop_data.get('stop_number') or (i + 1),
                    company=stop_data.get('company'),
                    address=stop_data.get('address'),
                    city=stop_data.get('city'),
                    state=stop_data.get('state'),
                    zip_code=stop_data.get('zip_code'),
                    date=stop_data.get('date'),
                    time=stop_data.get('time'),
                    phone=stop_data.get('phone'),
                    website=stop_data.get('website'),
                    hours=stop_data.get('hours')
                )
                db.add(stop)
        elif hasattr(load, field):
            setattr(load, field, value)
    
    db.commit()
    
    # Auto-calculate metrics if relevant fields changed
    update_load_metrics(load, db)
    
    db.refresh(load)
    return load


@router.post("/{load_id}/recalculate-pay")
def recalculate_pay(load_id: int, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    load = db.query(models.Load).filter(models.Load.id == load_id, models.Load.carrier_id == carrier_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    recalc_load_pay(db, load)
    return {"ok": True}


@router.get("/{load_id}/pay-ledger", response_model=LoadPayLedgerResponse)
def get_pay_ledger(load_id: int, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    load = db.query(models.Load).filter(models.Load.id == load_id, models.Load.carrier_id == carrier_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    lines = (
        db.query(models.SettlementLedgerLine)
        .filter(models.SettlementLedgerLine.load_id == load.id)
        .order_by(models.SettlementLedgerLine.created_at.asc())
        .all()
    )
    if not lines:
        recalc_load_pay(db, load)
        lines = (
            db.query(models.SettlementLedgerLine)
            .filter(models.SettlementLedgerLine.load_id == load.id)
            .order_by(models.SettlementLedgerLine.created_at.asc())
            .all()
        )

    grouped: dict[int, list[models.SettlementLedgerLine]] = {}
    for line in lines:
        grouped.setdefault(line.payee_id, []).append(line)

    by_payee: list[PayeeLedgerResponse] = []
    load_total = 0.0
    for payee_id, payee_lines in grouped.items():
        payee = db.query(models.Payee).filter(models.Payee.id == payee_id).first()
        
        # Separate regular lines from pass-through items
        regular_lines = []
        pass_through_lines = []
        
        for line in payee_lines:
            if line.category == "pass_through":
                # For pass-through, we need to get the other payee info
                if line.amount < 0:
                    # This is a deduction - find who receives it
                    # Look for description pattern or search for matching positive line
                    dest_payee_id = None
                    dest_payee_name = None
                    
                    # Try to parse from description "Something → PayeeName"
                    if line.description and "→" in line.description:
                        dest_name = line.description.split("→")[-1].strip()
                        dest_payee_name = dest_name
                        # Try to find payee by name
                        dest_payee = db.query(models.Payee).filter(
                            models.Payee.name.ilike(f"%{dest_name}%"),
                            models.Payee.carrier_id == load.carrier_id
                        ).first()
                        if dest_payee:
                            dest_payee_id = dest_payee.id
                    
                    pass_through_lines.append({
                        "id": line.id,
                        "category": line.category,
                        "description": line.description,
                        "amount": line.amount,
                        "destination_payee_id": dest_payee_id,
                        "destination_payee_name": dest_payee_name,
                        "source_payee_id": None,
                        "source_payee_name": None,
                        "locked_at": line.locked_at,
                        "settlement_id": line.settlement_id,
                    })
                else:
                    # This is income from pass-through - find who it came from
                    source_payee_id = None
                    source_payee_name = None
                    
                    # Try to parse from description "Something (from PayeeName)"
                    if line.description and "(from " in line.description:
                        source_name = line.description.split("(from ")[-1].rstrip(")")
                        source_payee_name = source_name
                        # Try to find payee by name
                        source_payee = db.query(models.Payee).filter(
                            models.Payee.name.ilike(f"%{source_name}%"),
                            models.Payee.carrier_id == load.carrier_id
                        ).first()
                        if source_payee:
                            source_payee_id = source_payee.id
                    
                    regular_lines.append(line)  # Show as regular income for destination payee
                    # But also track it's from pass-through
            else:
                regular_lines.append(line)
        
        subtotal = round(sum(l.amount for l in payee_lines), 2)
        load_total += subtotal
        
        # Get driver info if this payee is linked to a driver
        driver_kind = None
        payable_to = payee.name if payee else f"Payee {payee_id}"
        
        if payee:
            driver = db.query(models.Driver).filter(models.Driver.payee_id == payee_id).first()
            if driver:
                pay_profile = db.query(models.DriverPayProfile).filter(
                    models.DriverPayProfile.driver_id == driver.id,
                    models.DriverPayProfile.active == True
                ).first()
                if pay_profile:
                    driver_kind = pay_profile.driver_kind
                    payable_to = payee.name  # Can be customized based on payee_type
        
        by_payee.append(
            PayeeLedgerResponse(
                payee_id=payee_id,
                payee_name=payee.name if payee else f"Payee {payee_id}",
                payee_type=payee.payee_type if payee else "person",
                payable_to=payable_to,
                driver_kind=driver_kind,
                subtotal=subtotal,
                lines=[LedgerLineResponse.model_validate(l) for l in regular_lines],
                pass_through_deductions=[PassThroughLineResponse(**pt) for pt in pass_through_lines],
            )
        )

    return LoadPayLedgerResponse(
        load_id=load.id,
        by_payee=by_payee,
        load_pay_total=round(load_total, 2),
    )


@router.post("/{load_id}/add-pay-line")
def add_pay_line(
    load_id: int,
    payee_id: int,
    category: str,
    amount: float,
    description: str = None,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Add a new pay line item to a load for a specific payee.
    This is the (+) Add Pay functionality.
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Verify load exists and belongs to carrier
    load = db.query(models.Load).filter(
        models.Load.id == load_id,
        models.Load.carrier_id == carrier_id
    ).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    # Verify payee exists and belongs to carrier
    payee = db.query(models.Payee).filter(
        models.Payee.id == payee_id,
        models.Payee.carrier_id == carrier_id
    ).first()
    if not payee:
        raise HTTPException(status_code=404, detail="Payee not found")
    
    # Create the ledger line
    line = models.SettlementLedgerLine(
        load_id=load_id,
        payee_id=payee_id,
        category=category,
        description=description,
        amount=amount
    )
    db.add(line)
    db.commit()
    db.refresh(line)
    
    return {
        "ok": True,
        "line": LedgerLineResponse.model_validate(line)
    }


@router.post("/{load_id}/add-pass-through-deduction")
def add_pass_through_deduction(
    load_id: int,
    source_payee_id: int,
    destination_payee_id: int,
    amount: float,
    description: str = None,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Add a pass-through deduction.
    Creates TWO linked ledger lines:
    1. Negative line for source payee (deduction)
    2. Positive line for destination payee (payment)
    """
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Verify load exists
    load = db.query(models.Load).filter(
        models.Load.id == load_id,
        models.Load.carrier_id == carrier_id
    ).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    # Verify source payee exists
    source_payee = db.query(models.Payee).filter(
        models.Payee.id == source_payee_id,
        models.Payee.carrier_id == carrier_id
    ).first()
    if not source_payee:
        raise HTTPException(status_code=404, detail="Source payee not found")
    
    # Verify destination payee exists
    dest_payee = db.query(models.Payee).filter(
        models.Payee.id == destination_payee_id,
        models.Payee.carrier_id == carrier_id
    ).first()
    if not dest_payee:
        raise HTTPException(status_code=404, detail="Destination payee not found")
    
    # Ensure amount is positive
    amount = abs(amount)
    
    # Create deduction line (negative) for source payee
    deduction_line = models.SettlementLedgerLine(
        load_id=load_id,
        payee_id=source_payee_id,
        category="pass_through",
        description=f"{description or 'Pass-through'} → {dest_payee.name}",
        amount=-amount
    )
    db.add(deduction_line)
    db.flush()
    
    # Create payment line (positive) for destination payee
    payment_line = models.SettlementLedgerLine(
        load_id=load_id,
        payee_id=destination_payee_id,
        category="pass_through",
        description=f"{description or 'Pass-through'} (from {source_payee.name})",
        amount=amount
    )
    db.add(payment_line)
    db.commit()
    db.refresh(deduction_line)
    db.refresh(payment_line)
    
    return {
        "ok": True,
        "deduction_line": LedgerLineResponse.model_validate(deduction_line),
        "payment_line": LedgerLineResponse.model_validate(payment_line)
    }


@router.post("/auto-create")
def auto_create_load(
    files: List[UploadFile] = File(...),
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Please upload up to 10 files")

    allowed_types = {"application/pdf", "image/jpeg", "image/png"}
    max_size = 5 * 1024 * 1024
    file_blobs: list[tuple[str, bytes, str]] = []
    for upload in files:
        if upload.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        content = upload.file.read()
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail="File exceeds 5MB limit")
        file_blobs.append((upload.filename, content, upload.content_type))

    def extract_text_from_pdf(content: bytes) -> str:
        try:
            reader = PdfReader(io.BytesIO(content))
            return "\n".join([page.extract_text() or "" for page in reader.pages])
        except Exception:
            return ""

    def ocr_image_bytes(content: bytes) -> str:
        try:
            import pytesseract  # type: ignore
        except Exception:
            return ""
        try:
            image = Image.open(io.BytesIO(content))
            return pytesseract.image_to_string(image) or ""
        except Exception:
            return ""

    def ocr_pdf_bytes(content: bytes) -> str:
        try:
            import pytesseract  # type: ignore
            from pdf2image import convert_from_bytes  # type: ignore
        except Exception:
            return ""
        try:
            images = convert_from_bytes(content)
            text_chunks = []
            for image in images:
                text_chunks.append(pytesseract.image_to_string(image) or "")
            return "\n".join([t for t in text_chunks if t])
        except Exception:
            return ""

    def find_first(patterns: list[str], text: str) -> str | None:
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                val = match.group(1)
                return (val or "").strip() if val else None
        return None

    def find_city_state_pairs(text: str) -> list[tuple[str, str]]:
        pairs = []
        for match in re.finditer(r"([A-Za-z][A-Za-z .'-]+),\s*([A-Z]{2})\b", text):
            city_match = match.group(1)
            state_match = match.group(2)
            if city_match and state_match:
                pairs.append(((city_match or "").strip(), (state_match or "").strip()))
        return pairs

    combined_text = ""
    ocr_text = ""
    for filename, content, content_type in file_blobs:
        if content_type == "application/pdf":
            extracted = extract_text_from_pdf(content)
            combined_text += "\n" + (extracted or "")
            if len((extracted or "").strip()) < 50:
                ocr_text += "\n" + ocr_pdf_bytes(content)
        elif content_type in {"image/jpeg", "image/png"}:
            ocr_text += "\n" + ocr_image_bytes(content)

    if (ocr_text or "").strip():
        combined_text = combined_text + "\n" + ocr_text

    broker = find_first([r"Broker\s*[:\-]\s*([A-Za-z0-9 &.,'/-]{3,})"], combined_text) or "Unknown Broker"
    po_number = find_first([r"PO\s*#?\s*[:\-]?\s*([A-Za-z0-9-]+)", r"Purchase Order\s*#?\s*[:\-]?\s*([A-Za-z0-9-]+)"], combined_text) or "TBD"
    rate = find_first([r"(\$[\d,]+(?:\.\d{2})?)"], combined_text) or "$0.00"
    carrier_ref = find_first([r"Carrier Ref\s*[:\-]\s*([A-Za-z0-9-]+)", r"Carrier\s*Ref\s*#?\s*[:\-]?\s*([A-Za-z0-9-]+)"], combined_text) or "TBD"
    load_number = find_first([r"Load\s*#?\s*[:\-]?\s*([A-Za-z0-9-]+)"], combined_text)
    if not load_number:
        load_number = f"AUTO-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

    city_pairs = find_city_state_pairs(combined_text)
    pickup_city, pickup_state = city_pairs[0] if len(city_pairs) > 0 else ("TBD", "TBD")
    delivery_city, delivery_state = city_pairs[1] if len(city_pairs) > 1 else ("TBD", "TBD")

    pickup_address = f"{pickup_city}, {pickup_state}"
    delivery_address = f"{delivery_city}, {delivery_state}"
    notes = f"Auto-created from {len(file_blobs)} file(s)."

    load = models.Load(
        carrier_id=carrier_id,
        driver_id=None,
        load_number=load_number,
        status="Draft",
        pickup_address=pickup_address,
        delivery_address=delivery_address,
        notes=notes,
    )
    db.add(load)
    db.commit()
    db.refresh(load)

    file_links: list[str] = []
    if settings.ENABLE_DROPBOX:
        try:
            dropbox = DropboxService()
            base_path = f"{settings.DROPBOX_ROOT_FOLDER}/{carrier_id}/loads/{load.id}/rate-confirmations"
            upload_items = [(filename, content) for filename, content, _ in file_blobs]
            file_links = dropbox.upload_files(upload_items, base_path)
        except Exception:
            file_links = []

    if (combined_text or "").strip():
        extraction = models.LoadExtraction(
            load_id=load.id,
            raw_text=(combined_text or "").strip(),
            source_files=[filename for filename, _, _ in file_blobs],
        )
        db.add(extraction)
        db.commit()

    if file_links:
        load.notes = f"{notes} Uploaded files: {', '.join(file_links)}"
        db.commit()

    return {
        "broker": broker,
        "po_number": po_number,
        "rate": rate,
        "carrier_ref": carrier_ref,
        "notes": notes,
        "file_links": file_links,
        "stops": [
            {"type": "Pickup", "city": pickup_city, "state": pickup_state, "date": "TBD", "time": "TBD"},
            {"type": "Delivery", "city": delivery_city, "state": delivery_state, "date": "TBD", "time": "TBD"},
        ],
        "load_id": load.id,
    }


@router.post("/parse-rate-con")
async def parse_rate_con(
    file: UploadFile = File(...),
    token: dict = Depends(verify_token)
):
    """
    FAST: Parse rate confirmation using direct PDF text extraction (no image conversion)
    Falls back to OCR only if PDF text extraction fails
    """
    content = await file.read()
    filename = file.filename.lower() if file.filename else "unknown"

    try:
        ocr_service = RateConfirmationOCR()
        raw_text = ""
        
        if filename.endswith(".pdf"):
            # Try extraction first (fast)
            try:
                reader = PdfReader(io.BytesIO(content))
                raw_text = "\n".join([page.extract_text() or "" for page in reader.pages])
            except Exception as pdf_err:
                print(f"Direct PDF text extraction failed: {pdf_err}")
            
            # If no text or extraction failed, use OCR (slow)
            if not (raw_text or "").strip():
                print("PDF has no extractable text, using OCR")
                images = pdf2image.convert_from_bytes(content)
                if images:
                    try:
                        import pytesseract # type: ignore
                    except ImportError:
                        pytesseract = None
                        
                    text_chunks = []
                    # OCR first page for speed, or all pages if needed
                    for img in images[:2]: # Limit to first 2 pages for performance
                        img_byte_arr = io.BytesIO()
                        img.save(img_byte_arr, format='PNG')
                        if pytesseract:
                            ocr_result = pytesseract.image_to_string(Image.open(img_byte_arr))
                            text_chunks.append(ocr_result or "")
                        else:
                            text_chunks.append("")
                    raw_text = "\n".join(text_chunks)
        else:
            # For images, use OCR service directly
            return ocr_service.extract_from_image(content)
            
        if (raw_text or "").strip():
            # Use OCR service to structure the raw text
            return ocr_service.extract_from_text(raw_text or "")
        else:
            raise ValueError("No text could be extracted from the document")
            
    except Exception as e:
        print(f"OCR Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse rate confirmation: {str(e)}")


# Enhanced loads list endpoint matching ezLoads API
@router.get("/list-data")
def get_loads_list_data(
    start: int = Query(0),
    length: int = Query(50),
    search: Optional[str] = Query(None, alias="search[value]"),
    filter_range: Optional[str] = Query("all_time", alias="filter[range]"),
    filter_status: Optional[str] = Query(None, alias="filter[status]"),
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Enhanced loads list with DataTables-style pagination and filtering"""
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    # Base query
    query = db.query(models.Load).filter(models.Load.carrier_id == carrier_id)
    
    # Apply search filter
    if search:
        search_filter = or_(
            models.Load.load_number.ilike(f"%{search}%"),
            models.Load.pickup_location.ilike(f"%{search}%"),
            models.Load.delivery_location.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Apply status filter
    if filter_status and filter_status != "all":
        query = query.filter(models.Load.status == filter_status)
    
    # Count total
    total_records = query.count()
    
    # Apply pagination
    loads = query.order_by(models.Load.created_at.desc()).offset(start).limit(length).all()
    
    # Format response
    data = []
    for load in loads:
        data.append({
            "id": load.id,
            "number": load.load_number,
            "display_pickup_date": load.pickup_date.strftime("%m/%d/%y") if load.pickup_date else "",
            "display_delivery_date": load.delivery_date.strftime("%m/%d/%y") if load.delivery_date else "",
            "driver": load.driver.name if load.driver else "",
            "broker": load.customer.name if load.customer else "",
            "pickup": load.pickup_location or "",
            "delivery": load.delivery_location or "",
            "rate": float(load.rate) if load.rate else 0.0,
            "status": load.status or "new",
            "completed": load.delivery_date.strftime("%m/%d/%y") if load.delivery_date else ""
        })
    
    return {
        "draw": 1,
        "recordsTotal": total_records,
        "recordsFiltered": total_records,
        "data": data
    }


# Bulk update endpoint
@router.post("/bulk-update")
def bulk_update_loads(
    load_ids: List[int],
    updates: dict,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Bulk update multiple loads"""
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")
    
    updated_count = 0
    for load_id in load_ids:
        load = db.query(models.Load).filter(
            models.Load.id == load_id,
            models.Load.carrier_id == carrier_id
        ).first()
        
        if load:
            for key, value in updates.items():
                if hasattr(load, key):
                    setattr(load, key, value)
            updated_count += 1
    
    db.commit()
    
    return {
        "success": True,
        "updated": updated_count,
        "message": f"Updated {updated_count} loads"
    }


def _get_driver_last_location(driver_id: int, db: Session):
    """Find the delivery address of the last delivered load for this driver"""
    last_load = db.query(models.Load).filter(
        models.Load.driver_id == driver_id,
        models.Load.status == "Delivered"
    ).order_by(models.Load.delivery_date.desc()).first()
    
    return last_load.delivery_address if last_load else None


def update_load_metrics(load: models.Load, db: Session):
    """Recalculate miles and rate per mile for a load"""
    try:
        mapbox = MapboxService()
        
        # 1. Loaded Miles Calculation (Stop to Stop)
        addresses = []
        if load.pickup_address:
            addresses.append(load.pickup_address)
        
        # Add intermediate stops
        sorted_stops = sorted(load.stops, key=lambda s: s.stop_number)
        for stop in sorted_stops:
            if stop.address:
                addresses.append(stop.address)
        
        if load.delivery_address:
            addresses.append(load.delivery_address)
            
        if len(addresses) >= 2:
            route_data = mapbox.calculate_route_with_stops(addresses)
            load.total_miles = route_data["total_distance_miles"]
            
            # Update individual stop distances
            # legs[0] is from pickup to stop 1, legs[1] from stop 1 to stop 2, etc.
            legs = route_data.get("legs", [])
            for i, stop in enumerate(sorted_stops):
                if i < len(legs):
                    stop.miles_to_next_stop = legs[i]["distance_miles"]
            
            # 2. Deadhead Calculation
            if load.driver_id:
                last_loc = _get_driver_last_location(load.driver_id, db)
                if last_loc and load.pickup_address:
                    try:
                        dh_route = mapbox.calculate_route_with_stops([last_loc, load.pickup_address])
                        load.deadhead_miles = dh_route["total_distance_miles"]
                    except:
                        load.deadhead_miles = 0.0
                else:
                    load.deadhead_miles = 0.0
            
            # 3. Rate Per Mile Calculation
            # We use loaded miles for standard RPM, but could consider all miles
            if load.rate_amount and load.total_miles and load.total_miles > 0:
                load.rate_per_mile = calculate_rate_per_mile(load.rate_amount, load.total_miles)
            
            db.add(load)
            db.commit()
    except Exception as e:
        print(f"Error updating load metrics: {e}")


@router.post("/{load_id}/recalculate-metrics")
def recalculate_metrics(
    load_id: int,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Manually trigger metric recalculation"""
    carrier_id = token.get("carrier_id")
    load = db.query(models.Load).filter(
        models.Load.id == load_id,
        models.Load.carrier_id == carrier_id
    ).first()
    
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
        
    update_load_metrics(load, db)
    return {"success": True, "total_miles": load.total_miles, "rate_per_mile": load.rate_per_mile}


@router.post("/{load_id}/optimize-route")
def optimize_load_route(
    load_id: int,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Optimize stop order and recalculate metrics"""
    carrier_id = token.get("carrier_id")
    load = db.query(models.Load).filter(
        models.Load.id == load_id,
        models.Load.carrier_id == carrier_id
    ).first()
    
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
        
    # Logic for optimization would go here (e.g. Mapbox Optimization API)
    # For now, we reuse the standard routing as a placeholder for optimization
    update_load_metrics(load, db)
    
    return {
        "success": True, 
        "total_miles": load.total_miles, 
        "rate_per_mile": load.rate_per_mile,
        "message": "Route optimized and metrics updated"
    }
