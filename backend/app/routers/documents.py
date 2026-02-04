"""
Document generation API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Load, User
from app.services.pdf_generator import PDFGenerator
from app.routers.invoices import Invoice

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/rate-confirmation/{load_id}")
def generate_rate_confirmation(
    load_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate Rate Confirmation PDF for a load"""
    carrier_id = current_user.carrier_id
    
    # Get load
    load = db.query(Load).filter(
        and_(
            Load.id == load_id,
            Load.carrier_id == carrier_id
        )
    ).first()
    
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    # Get carrier info (you'd query from carriers table)
    carrier_info = {
        'company_name': 'Main TMS',
        'address': '123 Transport Way, City, ST 12345',
        'mc_number': 'MC-123456',
        'dot_number': 'DOT-654321',
        'phone': '(555) 123-4567',
        'email': 'dispatch@maintms.com'
    }
    
    # Prepare load data
    load_data = {
        'load_number': load.load_number,
        'broker_name': load.broker_name,
        'rate_amount': load.rate_amount,
        'po_number': load.po_number,
        'pickup_address': load.pickup_address,
        'delivery_address': load.delivery_address,
        'pickup_date': 'TBD',
        'delivery_date': 'TBD',
        'notes': load.notes
    }
    
    # Generate PDF
    pdf_generator = PDFGenerator()
    pdf_buffer = pdf_generator.generate_rate_confirmation(load_data, carrier_info)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=RateCon_{load.load_number}.pdf"
        }
    )


@router.get("/bill-of-lading/{load_id}")
def generate_bill_of_lading(
    load_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate Bill of Lading PDF for a load"""
    carrier_id = current_user.carrier_id
    
    # Get load
    load = db.query(Load).filter(
        and_(
            Load.id == load_id,
            Load.carrier_id == carrier_id
        )
    ).first()
    
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    # Get carrier info
    carrier_info = {
        'company_name': 'Main TMS',
        'mc_number': 'MC-123456',
        'dot_number': 'DOT-654321',
    }
    
    # Prepare load data
    load_data = {
        'load_number': load.load_number,
        'driver_name': f"{load.driver.first_name} {load.driver.last_name}" if load.driver else 'TBD',
        'pickup_address': load.pickup_address,
        'delivery_address': load.delivery_address,
        'rate_amount': load.rate_amount,
        'commodity_description': 'General Freight',
        'weight': 'TBD'
    }
    
    # Generate PDF
    pdf_generator = PDFGenerator()
    pdf_buffer = pdf_generator.generate_bill_of_lading(load_data, carrier_info)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=BOL_{load.load_number}.pdf"
        }
    )


@router.get("/invoice/{invoice_id}")
def generate_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate Invoice PDF"""
    carrier_id = current_user.carrier_id
    
    # Get invoice
    invoice = db.query(Invoice).filter(
        and_(
            Invoice.id == invoice_id,
            Invoice.carrier_id == carrier_id
        )
    ).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get carrier info
    carrier_info = {
        'company_name': 'Main TMS',
        'address': '123 Transport Way, City, ST 12345',
        'phone': '(555) 123-4567',
        'email': 'billing@maintms.com'
    }
    
    # Get line items
    from app.routers.invoices import InvoiceLineItem
    line_items = db.query(InvoiceLineItem).filter(
        InvoiceLineItem.invoice_id == invoice.id
    ).all()
    
    # Prepare invoice data
    invoice_data = {
        'invoice_number': invoice.invoice_number,
        'invoice_date': invoice.invoice_date.strftime('%m/%d/%Y'),
        'due_date': invoice.due_date.strftime('%m/%d/%Y'),
        'payment_terms': invoice.payment_terms,
        'customer_name': 'Customer Name',  # Get from customers table
        'subtotal': invoice.subtotal,
        'tax_amount': invoice.tax_amount,
        'total_amount': invoice.total_amount,
        'amount_paid': invoice.amount_paid,
        'balance_due': invoice.balance_due,
        'line_items': [
            {
                'description': item.description,
                'quantity': item.quantity,
                'unit_price': item.unit_price,
                'amount': item.amount
            }
            for item in line_items
        ]
    }
    
    # Generate PDF
    pdf_generator = PDFGenerator()
    pdf_buffer = pdf_generator.generate_invoice_pdf(invoice_data, carrier_info)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Invoice_{invoice.invoice_number}.pdf"
        }
    )
