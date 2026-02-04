"""
PDF document generation service
Uses ReportLab for creating professional PDFs
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from datetime import datetime
from typing import Optional


class PDFGenerator:
    """Generate professional PDF documents"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='CompanyName',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#0abf53'),
            spaceAfter=6,
            alignment=TA_LEFT
        ))
        
        self.styles.add(ParagraphStyle(
            name='DocumentTitle',
            parent=self.styles['Heading2'],
            fontSize=18,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=12,
            spaceBefore=12,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading3'],
            fontSize=14,
            textColor=colors.HexColor('#0abf53'),
            spaceAfter=6,
            spaceBefore=12
        ))
    
    def generate_rate_confirmation(self, load_data: dict, carrier_info: dict) -> BytesIO:
        """
        Generate a Rate Confirmation PDF
        
        Args:
            load_data: Dictionary with load information
            carrier_info: Dictionary with carrier company information
        
        Returns:
            BytesIO buffer containing the PDF
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        story = []
        
        # Header with company info
        story.append(Paragraph(carrier_info.get('company_name', 'Main TMS'), self.styles['CompanyName']))
        story.append(Paragraph(f"{carrier_info.get('address', '')}", self.styles['Normal']))
        story.append(Paragraph(f"MC: {carrier_info.get('mc_number', 'N/A')} | DOT: {carrier_info.get('dot_number', 'N/A')}", self.styles['Normal']))
        story.append(Paragraph(f"Phone: {carrier_info.get('phone', '')} | Email: {carrier_info.get('email', '')}", self.styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Document title
        story.append(Paragraph("RATE CONFIRMATION", self.styles['DocumentTitle']))
        story.append(Spacer(1, 0.2*inch))
        
        # Load details table
        story.append(Paragraph("Load Information", self.styles['SectionHeader']))
        
        load_info = [
            ['Load Number:', load_data.get('load_number', 'N/A')],
            ['Date:', datetime.now().strftime('%m/%d/%Y')],
            ['Broker:', load_data.get('broker_name', 'N/A')],
            ['Rate:', f"${load_data.get('rate_amount', 0):,.2f}"],
            ['PO Number:', load_data.get('po_number', 'N/A')],
        ]
        
        load_table = Table(load_info, colWidths=[2*inch, 4*inch])
        load_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(load_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Pickup information
        story.append(Paragraph("Pickup Information", self.styles['SectionHeader']))
        pickup_info = [
            ['Address:', load_data.get('pickup_address', 'N/A')],
            ['Date/Time:', load_data.get('pickup_date', 'N/A')],
        ]
        pickup_table = Table(pickup_info, colWidths=[2*inch, 4*inch])
        pickup_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8f5e9')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(pickup_table)
        story.append(Spacer(1, 0.2*inch))
        
        # Delivery information
        story.append(Paragraph("Delivery Information", self.styles['SectionHeader']))
        delivery_info = [
            ['Address:', load_data.get('delivery_address', 'N/A')],
            ['Date/Time:', load_data.get('delivery_date', 'N/A')],
        ]
        delivery_table = Table(delivery_info, colWidths=[2*inch, 4*inch])
        delivery_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e3f2fd')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(delivery_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Notes
        if load_data.get('notes'):
            story.append(Paragraph("Additional Notes", self.styles['SectionHeader']))
            story.append(Paragraph(load_data['notes'], self.styles['Normal']))
            story.append(Spacer(1, 0.2*inch))
        
        # Signature section
        story.append(Spacer(1, 0.5*inch))
        sig_data = [
            ['Carrier Signature:', '_' * 40, 'Date:', '_' * 20],
            ['', '', '', ''],
            ['Broker Signature:', '_' * 40, 'Date:', '_' * 20],
        ]
        sig_table = Table(sig_data, colWidths=[1.5*inch, 3*inch, 0.75*inch, 1.25*inch])
        sig_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(sig_table)
        
        # Footer
        story.append(Spacer(1, 0.3*inch))
        footer_text = f"Generated on {datetime.now().strftime('%m/%d/%Y %I:%M %p')} | Main TMS - AI-Powered Transportation Management"
        story.append(Paragraph(footer_text, self.styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def generate_bill_of_lading(self, load_data: dict, carrier_info: dict) -> BytesIO:
        """
        Generate a Bill of Lading PDF
        
        Args:
            load_data: Dictionary with load information
            carrier_info: Dictionary with carrier company information
        
        Returns:
            BytesIO buffer containing the PDF
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        story = []
        
        # Header
        story.append(Paragraph("BILL OF LADING", self.styles['DocumentTitle']))
        story.append(Paragraph(f"BOL #: {load_data.get('load_number', 'N/A')}", self.styles['Normal']))
        story.append(Paragraph(f"Date: {datetime.now().strftime('%m/%d/%Y')}", self.styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Carrier information
        story.append(Paragraph("Carrier Information", self.styles['SectionHeader']))
        carrier_data = [
            ['Company:', carrier_info.get('company_name', 'N/A')],
            ['MC Number:', carrier_info.get('mc_number', 'N/A')],
            ['DOT Number:', carrier_info.get('dot_number', 'N/A')],
            ['Driver:', load_data.get('driver_name', 'N/A')],
        ]
        carrier_table = Table(carrier_data, colWidths=[2*inch, 4*inch])
        carrier_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(carrier_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Shipper (Pickup)
        story.append(Paragraph("Shipper (Pickup)", self.styles['SectionHeader']))
        story.append(Paragraph(load_data.get('pickup_address', 'N/A'), self.styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        
        # Consignee (Delivery)
        story.append(Paragraph("Consignee (Delivery)", self.styles['SectionHeader']))
        story.append(Paragraph(load_data.get('delivery_address', 'N/A'), self.styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Commodity information
        story.append(Paragraph("Commodity Information", self.styles['SectionHeader']))
        commodity_data = [
            ['Description', 'Quantity', 'Weight', 'Value'],
            [load_data.get('commodity_description', 'General Freight'), '1', load_data.get('weight', 'N/A'), f"${load_data.get('rate_amount', 0):,.2f}"],
        ]
        commodity_table = Table(commodity_data, colWidths=[3*inch, 1*inch, 1*inch, 1.5*inch])
        commodity_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0abf53')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(commodity_table)
        story.append(Spacer(1, 0.5*inch))
        
        # Signature section
        sig_data = [
            ['Shipper Signature:', '_' * 40, 'Date:', '_' * 20],
            ['', '', '', ''],
            ['Driver Signature:', '_' * 40, 'Date:', '_' * 20],
            ['', '', '', ''],
            ['Consignee Signature:', '_' * 40, 'Date:', '_' * 20],
        ]
        sig_table = Table(sig_data, colWidths=[1.5*inch, 3*inch, 0.75*inch, 1.25*inch])
        sig_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(sig_table)
        
        # Disclaimer
        story.append(Spacer(1, 0.3*inch))
        disclaimer = "This is a legally binding document. By signing, all parties acknowledge receipt and acceptance of the shipment as described."
        story.append(Paragraph(disclaimer, self.styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def generate_invoice_pdf(self, invoice_data: dict, carrier_info: dict) -> BytesIO:
        """
        Generate an Invoice PDF
        
        Args:
            invoice_data: Dictionary with invoice information
            carrier_info: Dictionary with carrier company information
        
        Returns:
            BytesIO buffer containing the PDF
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        story = []
        
        # Header with company info
        story.append(Paragraph(carrier_info.get('company_name', 'Main TMS'), self.styles['CompanyName']))
        story.append(Paragraph(f"{carrier_info.get('address', '')}", self.styles['Normal']))
        story.append(Paragraph(f"Phone: {carrier_info.get('phone', '')} | Email: {carrier_info.get('email', '')}", self.styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Invoice title and number
        story.append(Paragraph("INVOICE", self.styles['DocumentTitle']))
        story.append(Spacer(1, 0.2*inch))
        
        # Invoice details
        invoice_info = [
            ['Invoice Number:', invoice_data.get('invoice_number', 'N/A')],
            ['Invoice Date:', invoice_data.get('invoice_date', 'N/A')],
            ['Due Date:', invoice_data.get('due_date', 'N/A')],
            ['Payment Terms:', invoice_data.get('payment_terms', 'Net 30')],
        ]
        info_table = Table(invoice_info, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Bill to
        story.append(Paragraph("Bill To:", self.styles['SectionHeader']))
        story.append(Paragraph(invoice_data.get('customer_name', 'N/A'), self.styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Line items
        story.append(Paragraph("Items", self.styles['SectionHeader']))
        
        line_items = [['Description', 'Qty', 'Unit Price', 'Amount']]
        for item in invoice_data.get('line_items', []):
            line_items.append([
                item.get('description', ''),
                str(item.get('quantity', 1)),
                f"${item.get('unit_price', 0):,.2f}",
                f"${item.get('amount', 0):,.2f}"
            ])
        
        items_table = Table(line_items, colWidths=[3.5*inch, 0.75*inch, 1.25*inch, 1.25*inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0abf53')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Totals
        totals_data = [
            ['Subtotal:', f"${invoice_data.get('subtotal', 0):,.2f}"],
            ['Tax:', f"${invoice_data.get('tax_amount', 0):,.2f}"],
            ['Total:', f"${invoice_data.get('total_amount', 0):,.2f}"],
            ['Amount Paid:', f"${invoice_data.get('amount_paid', 0):,.2f}"],
            ['Balance Due:', f"${invoice_data.get('balance_due', 0):,.2f}"],
        ]
        totals_table = Table(totals_data, colWidths=[4.75*inch, 1.5*inch])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(totals_table)
        
        # Payment instructions
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph("Payment Instructions", self.styles['SectionHeader']))
        payment_text = f"Please make payment within {invoice_data.get('payment_terms', 'Net 30')}. Make checks payable to {carrier_info.get('company_name', 'Main TMS')}."
        story.append(Paragraph(payment_text, self.styles['Normal']))
        
        # Footer
        story.append(Spacer(1, 0.3*inch))
        footer_text = "Thank you for your business! | Main TMS - AI-Powered Transportation Management"
        story.append(Paragraph(footer_text, self.styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        return buffer
