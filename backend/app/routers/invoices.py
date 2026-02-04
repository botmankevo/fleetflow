"""
Invoicing and accounts receivable API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Load
from app.routers.customers import Customer

router = APIRouter(prefix="/invoices", tags=["invoices"])


# Invoice model
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, Date, ForeignKey
from app.core.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    invoice_number = Column(String(100), nullable=False, unique=True, index=True)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(String(20), default="draft")  # draft, sent, paid, overdue, cancelled
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    amount_paid = Column(Float, default=0.0)
    balance_due = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    payment_terms = Column(String(50), default="Net 30")
    sent_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    load_id = Column(Integer, ForeignKey("loads.id"), nullable=True)
    description = Column(Text, nullable=False)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# Pydantic models
class InvoiceLineItemCreate(BaseModel):
    load_id: Optional[int] = None
    description: str
    quantity: float = 1.0
    unit_price: float
    amount: float


class InvoiceCreate(BaseModel):
    customer_id: int
    invoice_date: str  # YYYY-MM-DD
    payment_terms: str = "Net 30"
    line_items: List[InvoiceLineItemCreate]
    notes: Optional[str] = None
    tax_rate: float = 0.0


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    sent_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    amount_paid: Optional[float] = None


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    customer_id: int
    customer_name: str
    invoice_date: str
    due_date: str
    status: str
    subtotal: float
    tax_amount: float
    total_amount: float
    amount_paid: float
    balance_due: float
    payment_terms: str
    notes: Optional[str]
    created_at: datetime
    line_items: List[dict]


@router.post("/", response_model=InvoiceResponse)
def create_invoice(
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new invoice"""
    carrier_id = current_user.carrier_id

    # Verify customer belongs to carrier
    customer = db.query(Customer).filter(
        and_(
            Customer.id == invoice_data.customer_id,
            Customer.carrier_id == carrier_id
        )
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Generate invoice number
    last_invoice = db.query(Invoice).filter(
        Invoice.carrier_id == carrier_id
    ).order_by(Invoice.id.desc()).first()

    if last_invoice and last_invoice.invoice_number:
        try:
            last_num = int(last_invoice.invoice_number.split("-")[-1])
            invoice_number = f"INV-{last_num + 1:05d}"
        except:
            invoice_number = f"INV-{datetime.now().year}{datetime.now().month:02d}{datetime.now().day:02d}001"
    else:
        invoice_number = f"INV-{datetime.now().year}{datetime.now().month:02d}{datetime.now().day:02d}001"

    # Calculate totals
    subtotal = sum([item.amount for item in invoice_data.line_items])
    tax_amount = subtotal * invoice_data.tax_rate
    total_amount = subtotal + tax_amount

    # Parse dates
    invoice_date = datetime.strptime(invoice_data.invoice_date, "%Y-%m-%d").date()
    
    # Calculate due date based on payment terms
    days_map = {
        "Net 15": 15,
        "Net 30": 30,
        "Net 45": 45,
        "Net 60": 60,
        "Quick Pay": 7,
        "Due on Receipt": 0,
    }
    days = days_map.get(invoice_data.payment_terms, 30)
    due_date = invoice_date + timedelta(days=days)

    # Create invoice
    db_invoice = Invoice(
        carrier_id=carrier_id,
        customer_id=invoice_data.customer_id,
        invoice_number=invoice_number,
        invoice_date=invoice_date,
        due_date=due_date,
        status="draft",
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total_amount,
        amount_paid=0.0,
        balance_due=total_amount,
        payment_terms=invoice_data.payment_terms,
        notes=invoice_data.notes,
    )

    db.add(db_invoice)
    db.flush()

    # Create line items
    for item_data in invoice_data.line_items:
        line_item = InvoiceLineItem(
            invoice_id=db_invoice.id,
            load_id=item_data.load_id,
            description=item_data.description,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            amount=item_data.amount,
        )
        db.add(line_item)

    db.commit()
    db.refresh(db_invoice)

    return get_invoice_response(db, db_invoice, customer)


@router.get("/", response_model=List[InvoiceResponse])
def list_invoices(
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all invoices"""
    carrier_id = current_user.carrier_id

    query = db.query(Invoice).filter(Invoice.carrier_id == carrier_id)

    if status:
        query = query.filter(Invoice.status == status)

    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)

    invoices = query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for invoice in invoices:
        customer = db.query(Customer).filter(Customer.id == invoice.customer_id).first()
        result.append(get_invoice_response(db, invoice, customer))

    return result


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get invoice by ID"""
    carrier_id = current_user.carrier_id

    invoice = db.query(Invoice).filter(
        and_(
            Invoice.id == invoice_id,
            Invoice.carrier_id == carrier_id
        )
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    customer = db.query(Customer).filter(Customer.id == invoice.customer_id).first()

    return get_invoice_response(db, invoice, customer)


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    invoice_update: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update invoice"""
    carrier_id = current_user.carrier_id

    invoice = db.query(Invoice).filter(
        and_(
            Invoice.id == invoice_id,
            Invoice.carrier_id == carrier_id
        )
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Update fields
    if invoice_update.status:
        invoice.status = invoice_update.status
        
        if invoice_update.status == "sent" and not invoice.sent_at:
            invoice.sent_at = datetime.utcnow()
        
        if invoice_update.status == "paid" and not invoice.paid_at:
            invoice.paid_at = datetime.utcnow()

    if invoice_update.notes is not None:
        invoice.notes = invoice_update.notes

    if invoice_update.amount_paid is not None:
        invoice.amount_paid = invoice_update.amount_paid
        invoice.balance_due = invoice.total_amount - invoice.amount_paid
        
        if invoice.balance_due <= 0:
            invoice.status = "paid"
            invoice.paid_at = datetime.utcnow()

    invoice.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(invoice)

    customer = db.query(Customer).filter(Customer.id == invoice.customer_id).first()

    return get_invoice_response(db, invoice, customer)


@router.post("/{invoice_id}/send")
def send_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark invoice as sent"""
    carrier_id = current_user.carrier_id

    invoice = db.query(Invoice).filter(
        and_(
            Invoice.id == invoice_id,
            Invoice.carrier_id == carrier_id
        )
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.status = "sent"
    invoice.sent_at = datetime.utcnow()
    invoice.updated_at = datetime.utcnow()

    db.commit()

    return {"success": True, "message": "Invoice marked as sent"}


@router.post("/{invoice_id}/record-payment")
def record_payment(
    invoice_id: int,
    amount: float,
    payment_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a payment for an invoice"""
    carrier_id = current_user.carrier_id

    invoice = db.query(Invoice).filter(
        and_(
            Invoice.id == invoice_id,
            Invoice.carrier_id == carrier_id
        )
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.amount_paid += amount
    invoice.balance_due = invoice.total_amount - invoice.amount_paid

    if invoice.balance_due <= 0:
        invoice.status = "paid"
        invoice.paid_at = datetime.utcnow() if not payment_date else datetime.strptime(payment_date, "%Y-%m-%d")

    invoice.updated_at = datetime.utcnow()

    db.commit()

    return {
        "success": True,
        "message": "Payment recorded",
        "amount_paid": invoice.amount_paid,
        "balance_due": invoice.balance_due,
        "status": invoice.status,
    }


@router.get("/stats/summary")
def get_invoice_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get invoice statistics"""
    carrier_id = current_user.carrier_id

    invoices = db.query(Invoice).filter(Invoice.carrier_id == carrier_id).all()

    total_invoiced = sum([inv.total_amount for inv in invoices])
    total_paid = sum([inv.amount_paid for inv in invoices])
    total_outstanding = sum([inv.balance_due for inv in invoices if inv.status != "paid"])

    # Count by status
    draft_count = len([inv for inv in invoices if inv.status == "draft"])
    sent_count = len([inv for inv in invoices if inv.status == "sent"])
    paid_count = len([inv for inv in invoices if inv.status == "paid"])
    overdue_count = len([inv for inv in invoices if inv.status == "overdue"])

    # Overdue amount
    today = datetime.now().date()
    overdue_amount = sum([
        inv.balance_due for inv in invoices 
        if inv.due_date < today and inv.status not in ["paid", "cancelled"]
    ])

    return {
        "total_invoiced": total_invoiced,
        "total_paid": total_paid,
        "total_outstanding": total_outstanding,
        "overdue_amount": overdue_amount,
        "draft_count": draft_count,
        "sent_count": sent_count,
        "paid_count": paid_count,
        "overdue_count": overdue_count,
    }


def get_invoice_response(db: Session, invoice: Invoice, customer: Customer) -> dict:
    """Helper to format invoice response"""
    line_items = db.query(InvoiceLineItem).filter(
        InvoiceLineItem.invoice_id == invoice.id
    ).all()

    return {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "customer_id": invoice.customer_id,
        "customer_name": customer.company_name if customer else "Unknown",
        "invoice_date": invoice.invoice_date.isoformat(),
        "due_date": invoice.due_date.isoformat(),
        "status": invoice.status,
        "subtotal": invoice.subtotal,
        "tax_amount": invoice.tax_amount,
        "total_amount": invoice.total_amount,
        "amount_paid": invoice.amount_paid,
        "balance_due": invoice.balance_due,
        "payment_terms": invoice.payment_terms,
        "notes": invoice.notes,
        "created_at": invoice.created_at,
        "line_items": [
            {
                "id": item.id,
                "load_id": item.load_id,
                "description": item.description,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "amount": item.amount,
            }
            for item in line_items
        ],
    }
