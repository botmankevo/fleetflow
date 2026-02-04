from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import io
import re
from datetime import datetime
from app.core.security import verify_token
from app.core.database import get_db
from app.core.config import settings
from app.schemas.loads import LoadCreate, LoadUpdate, LoadResponse
from app.schemas.payroll import LoadPayLedgerResponse, PayeeLedgerResponse, LedgerLineResponse
from app import models
from app.services.dropbox import DropboxService
from pypdf import PdfReader
from PIL import Image
from app.services.pay_engine import recalc_load_pay

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
    
    loads = query.order_by(models.Load.created_at.desc()).all()
    
    # Enhance each load with parsed address data
    result = []
    for load in loads:
        load_dict = {
            'id': load.id,
            'carrier_id': load.carrier_id,
            'load_number': load.load_number,
            'status': load.status,
            'pickup_address': load.pickup_address,
            'delivery_address': load.delivery_address,
            'notes': load.notes,
            'driver_id': load.driver_id,
            'broker_name': load.broker_name,
            'po_number': load.po_number,
            'rate_amount': load.rate_amount,
            'broker_rate': load.rate_amount,
            'created_at': load.created_at.isoformat() if load.created_at else None,
            'updated_at': None,
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

    load = db.query(models.Load).filter(models.Load.id == load_id, models.Load.carrier_id == carrier_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if token.get("role") == "driver" and token.get("driver_id") and load.driver_id != token.get("driver_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    return load


@router.post("", response_model=LoadResponse)
def create_load(payload: LoadCreate, token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    carrier_id = token.get("carrier_id")
    if not carrier_id:
        raise HTTPException(status_code=400, detail="Missing carrier_id")

    load = models.Load(
        carrier_id=carrier_id,
        driver_id=payload.driver_id,
        load_number=payload.load_number,
        status=payload.status,
        pickup_address=payload.pickup_address,
        delivery_address=payload.delivery_address,
        notes=payload.notes,
    )
    db.add(load)
    db.commit()
    db.refresh(load)
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
        setattr(load, field, value)
    db.commit()
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
        subtotal = round(sum(l.amount for l in payee_lines), 2)
        load_total += subtotal
        by_payee.append(
            PayeeLedgerResponse(
                payee_id=payee_id,
                payee_name=payee.name if payee else f"Payee {payee_id}",
                payee_type=payee.payee_type if payee else "person",
                subtotal=subtotal,
                lines=[LedgerLineResponse.model_validate(l) for l in payee_lines],
            )
        )

    return LoadPayLedgerResponse(
        load_id=load.id,
        by_payee=by_payee,
        load_pay_total=round(load_total, 2),
    )


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
                return match.group(1).strip()
        return None

    def find_city_state_pairs(text: str) -> list[tuple[str, str]]:
        pairs = []
        for match in re.finditer(r"([A-Za-z][A-Za-z .'-]+),\\s*([A-Z]{2})\\b", text):
            city = match.group(1).strip()
            state = match.group(2).strip()
            if city and state:
                pairs.append((city, state))
        return pairs

    combined_text = ""
    ocr_text = ""
    for filename, content, content_type in file_blobs:
        if content_type == "application/pdf":
            extracted = extract_text_from_pdf(content)
            combined_text += "\n" + extracted
            if len(extracted.strip()) < 50:
                ocr_text += "\n" + ocr_pdf_bytes(content)
        elif content_type in {"image/jpeg", "image/png"}:
            ocr_text += "\n" + ocr_image_bytes(content)

    if ocr_text.strip():
        combined_text = combined_text + "\n" + ocr_text

    broker = find_first([r"Broker\\s*[:\\-]\\s*([A-Za-z0-9 &.,'/-]{3,})"], combined_text) or "Unknown Broker"
    po_number = find_first([r"PO\\s*#?\\s*[:\\-]?\\s*([A-Za-z0-9-]+)", r"Purchase Order\\s*#?\\s*[:\\-]?\\s*([A-Za-z0-9-]+)"], combined_text) or "TBD"
    rate = find_first([r"(\\$[\\d,]+(?:\\.\\d{2})?)"], combined_text) or "$0.00"
    carrier_ref = find_first([r"Carrier Ref\\s*[:\\-]\\s*([A-Za-z0-9-]+)", r"Carrier\\s*Ref\\s*#?\\s*[:\\-]?\\s*([A-Za-z0-9-]+)"], combined_text) or "TBD"
    load_number = find_first([r"Load\\s*#?\\s*[:\\-]?\\s*([A-Za-z0-9-]+)"], combined_text)
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

    if combined_text.strip():
        extraction = models.LoadExtraction(
            load_id=load.id,
            raw_text=combined_text.strip(),
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
