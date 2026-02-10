"""
Invoice PDF Generation Service
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.lib import colors
from io import BytesIO
from datetime import datetime


def generate_invoice_pdf(invoice, customer, line_items, carrier_name="Cox Transport & Logistics"):
    """
    Generate invoice PDF using ReportLab
    
    Args:
        invoice: Invoice model instance
        customer: Customer model instance
        line_items: List of InvoiceLineItem instances
        carrier_name: Name of the carrier company
        
    Returns:
        bytes: PDF file content
    """
    buffer = BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )
    
    # Container for PDF elements
    elements = []
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#333333'),
        spaceAfter=12
    )
    
    # Title
    title = Paragraph(f"<b>{carrier_name}</b>", title_style)
    elements.append(title)
    
    subtitle = Paragraph("<b>INVOICE</b>", heading_style)
    elements.append(subtitle)
    elements.append(Spacer(1, 0.2*inch))
    
    # Invoice details table (top section)
    invoice_info = [
        ['Invoice Number:', invoice.invoice_number, 'Invoice Date:', invoice.invoice_date.strftime('%m/%d/%Y')],
        ['Customer:', customer.name if customer else 'N/A', 'Due Date:', invoice.due_date.strftime('%m/%d/%Y')],
        ['Payment Terms:', invoice.payment_terms, 'Status:', invoice.status.upper()],
    ]
    
    invoice_table = Table(invoice_info, colWidths=[1.5*inch, 2.5*inch, 1.5*inch, 1.5*inch])
    invoice_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(invoice_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Bill To section
    if customer:
        bill_to_heading = Paragraph("<b>Bill To:</b>", heading_style)
        elements.append(bill_to_heading)
        
        bill_to_data = [
            [customer.name],
            [customer.contact_name] if customer.contact_name else [],
            [f"{customer.address}"] if customer.address else [],
            [f"{customer.city}, {customer.state} {customer.zip_code}"] if customer.city else [],
            [customer.phone] if customer.phone else [],
            [customer.email] if customer.email else [],
        ]
        
        # Filter empty rows
        bill_to_data = [row for row in bill_to_data if row]
        
        bill_to_table = Table(bill_to_data, colWidths=[6*inch])
        bill_to_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#555555')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(bill_to_table)
        elements.append(Spacer(1, 0.3*inch))
    
    # Line items table
    line_items_heading = Paragraph("<b>Line Items:</b>", heading_style)
    elements.append(line_items_heading)
    
    # Table header
    line_data = [['Description', 'Quantity', 'Unit Price', 'Amount']]
    
    # Add line items
    for item in line_items:
        line_data.append([
            item.description[:60],  # Truncate long descriptions
            f"{item.quantity:.2f}",
            f"${item.unit_price:,.2f}",
            f"${item.amount:,.2f}"
        ])
    
    # Create table
    line_table = Table(line_data, colWidths=[3.5*inch, 1*inch, 1.25*inch, 1.25*inch])
    line_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4a5568')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        
        # Data rows
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#333333')),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        
        # Grid
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#4a5568')),
    ]))
    elements.append(line_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Totals section
    totals_data = [
        ['Subtotal:', f"${invoice.subtotal:,.2f}"],
        ['Tax:', f"${invoice.tax_amount:,.2f}"],
        ['Total:', f"${invoice.total_amount:,.2f}"],
    ]
    
    if invoice.amount_paid > 0:
        totals_data.append(['Amount Paid:', f"${invoice.amount_paid:,.2f}"])
        totals_data.append(['Balance Due:', f"${invoice.balance_due:,.2f}"])
    
    totals_table = Table(totals_data, colWidths=[5*inch, 2*inch])
    totals_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -2), 'Helvetica'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#4a5568')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(totals_table)
    
    # Notes section
    if invoice.notes:
        elements.append(Spacer(1, 0.3*inch))
        notes_heading = Paragraph("<b>Notes:</b>", heading_style)
        elements.append(notes_heading)
        notes_text = Paragraph(invoice.notes, styles['Normal'])
        elements.append(notes_text)
    
    # Footer
    elements.append(Spacer(1, 0.5*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#666666'),
        alignment=TA_CENTER
    )
    footer_text = Paragraph(
        f"Thank you for your business!<br/>Questions? Contact us at {customer.email if customer and customer.email else 'support@maintms.com'}",
        footer_style
    )
    elements.append(footer_text)
    
    # Build PDF
    doc.build(elements)
    
    # Get PDF bytes
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes
