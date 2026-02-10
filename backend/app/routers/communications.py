"""
Communication System - Email and SMS API endpoints
SendGrid for email, Twilio for SMS
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr
import os

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Load, Driver
from app.routers.customers import Customer
from app.routers.invoices import Invoice

router = APIRouter(prefix="/communications", tags=["communications"])

# Configuration
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@maintms.com")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")


# Pydantic Models
class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str
    html: Optional[str] = None
    cc: Optional[List[EmailStr]] = None
    bcc: Optional[List[EmailStr]] = None


class SMSRequest(BaseModel):
    to: str  # Phone number
    message: str


class NotificationPreferences(BaseModel):
    email_enabled: bool = True
    sms_enabled: bool = True
    notify_load_assigned: bool = True
    notify_pod_submitted: bool = True
    notify_invoice_sent: bool = True


# Email Functions
def send_email_sendgrid(to: str, subject: str, body: str, html: str = None):
    """Send email using SendGrid API"""
    if not SENDGRID_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="SendGrid not configured. Set SENDGRID_API_KEY environment variable."
        )
    
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, Email, To, Content
        
        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        
        from_email = Email(SENDGRID_FROM_EMAIL)
        to_email = To(to)
        
        if html:
            content = Content("text/html", html)
        else:
            content = Content("text/plain", body)
        
        mail = Mail(from_email, to_email, subject, content)
        
        response = sg.client.mail.send.post(request_body=mail.get())
        
        return {
            "success": True,
            "status_code": response.status_code,
            "message": "Email sent successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )


def send_sms_twilio(to: str, message: str):
    """Send SMS using Twilio API"""
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN."
        )
    
    try:
        from twilio.rest import Client
        
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        sms = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to
        )
        
        return {
            "success": True,
            "sid": sms.sid,
            "status": sms.status,
            "message": "SMS sent successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send SMS: {str(e)}"
        )


# API Endpoints
@router.post("/email/send")
def send_email(
    email_data: EmailRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Send an email
    """
    result = send_email_sendgrid(
        to=email_data.to,
        subject=email_data.subject,
        body=email_data.body,
        html=email_data.html
    )
    
    return result


@router.post("/sms/send")
def send_sms(
    sms_data: SMSRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send an SMS message
    """
    result = send_sms_twilio(
        to=sms_data.to,
        message=sms_data.message
    )
    
    return result


@router.post("/notify/load-assigned")
def notify_load_assigned(
    load_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send notification when load is assigned to driver
    """
    carrier_id = current_user.carrier_id
    
    # Get load and driver
    load = db.query(Load).filter(
        Load.id == load_id,
        Load.carrier_id == carrier_id
    ).first()
    
    if not load or not load.driver_id:
        raise HTTPException(status_code=404, detail="Load or driver not found")
    
    driver = db.query(Driver).filter(Driver.id == load.driver_id).first()
    
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Send SMS
    sms_message = f"""
New Load Assigned!
Load #: {load.load_number}
Pickup: {load.origin}
Delivery: {load.destination}
Pickup Date: {load.pickup_date.strftime('%m/%d/%Y')}
Rate: ${load.rate:,.2f}

Please confirm receipt.
    """.strip()
    
    result = {"sms_sent": False, "email_sent": False}
    
    try:
        if driver.phone:
            send_sms_twilio(driver.phone, sms_message)
            result["sms_sent"] = True
    except Exception as e:
        result["sms_error"] = str(e)
    
    # Send Email
    if driver.email:
        try:
            email_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>New Load Assigned</h2>
                <p>Hi {driver.first_name},</p>
                <p>You have been assigned a new load:</p>
                <table style="border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Load Number:</td>
                        <td style="padding: 8px;">{load.load_number}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Pickup Location:</td>
                        <td style="padding: 8px;">{load.origin}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Delivery Location:</td>
                        <td style="padding: 8px;">{load.destination}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Pickup Date:</td>
                        <td style="padding: 8px;">{load.pickup_date.strftime('%m/%d/%Y')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Rate:</td>
                        <td style="padding: 8px;">${load.rate:,.2f}</td>
                    </tr>
                </table>
                <p>Please log in to the driver portal to view full details and confirm receipt.</p>
                <p>Safe travels!</p>
                <p><strong>Cox Transport & Logistics</strong></p>
            </body>
            </html>
            """
            
            send_email_sendgrid(
                to=driver.email,
                subject=f"New Load Assigned - {load.load_number}",
                body=sms_message,
                html=email_html
            )
            result["email_sent"] = True
        except Exception as e:
            result["email_error"] = str(e)
    
    return result


@router.post("/notify/invoice-sent")
def notify_invoice_sent(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send notification when invoice is sent to customer
    """
    carrier_id = current_user.carrier_id
    
    # Get invoice and customer
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.carrier_id == carrier_id
    ).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    customer = db.query(Customer).filter(Customer.id == invoice.customer_id).first()
    
    if not customer or not customer.email:
        raise HTTPException(status_code=404, detail="Customer email not found")
    
    # Send Email with invoice
    email_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>Invoice from Cox Transport & Logistics</h2>
        <p>Dear {customer.contact_name or customer.name},</p>
        <p>Thank you for your business. Please find your invoice below:</p>
        <table style="border-collapse: collapse; margin: 20px 0;">
            <tr>
                <td style="padding: 8px; font-weight: bold;">Invoice Number:</td>
                <td style="padding: 8px;">{invoice.invoice_number}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold;">Invoice Date:</td>
                <td style="padding: 8px;">{invoice.invoice_date.strftime('%m/%d/%Y')}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold;">Due Date:</td>
                <td style="padding: 8px;">{invoice.due_date.strftime('%m/%d/%Y')}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold;">Amount Due:</td>
                <td style="padding: 8px; font-size: 18px; color: #2563eb;">${invoice.total_amount:,.2f}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold;">Payment Terms:</td>
                <td style="padding: 8px;">{invoice.payment_terms}</td>
            </tr>
        </table>
        <p>To view and download your invoice, please visit our customer portal or reply to this email.</p>
        <p>Payment can be made via check, ACH, or wire transfer. Please reference invoice number {invoice.invoice_number} on all payments.</p>
        <p>Thank you for your continued business!</p>
        <p><strong>Cox Transport & Logistics</strong><br>
        Phone: (XXX) XXX-XXXX<br>
        Email: billing@maintms.com</p>
    </body>
    </html>
    """
    
    try:
        result = send_email_sendgrid(
            to=customer.email,
            subject=f"Invoice {invoice.invoice_number} from Cox Transport & Logistics",
            body=f"Invoice {invoice.invoice_number} - Amount Due: ${invoice.total_amount:,.2f}",
            html=email_html
        )
        
        # Mark invoice as sent
        invoice.status = "sent"
        invoice.sent_at = datetime.utcnow()
        db.commit()
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send invoice: {str(e)}"
        )


@router.post("/notify/pod-submitted")
def notify_pod_submitted(
    load_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send notification when POD is submitted by driver
    """
    carrier_id = current_user.carrier_id
    
    # Get load
    load = db.query(Load).filter(
        Load.id == load_id,
        Load.carrier_id == carrier_id
    ).first()
    
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    
    # Notify customer if they have email
    if load.customer_id:
        customer = db.query(Customer).filter(Customer.id == load.customer_id).first()
        
        if customer and customer.email:
            email_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Delivery Completed</h2>
                <p>Dear {customer.contact_name or customer.name},</p>
                <p>Your shipment has been successfully delivered:</p>
                <table style="border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Load Number:</td>
                        <td style="padding: 8px;">{load.load_number}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Delivery Location:</td>
                        <td style="padding: 8px;">{load.destination}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Delivery Date:</td>
                        <td style="padding: 8px;">{datetime.now().strftime('%m/%d/%Y %I:%M %p')}</td>
                    </tr>
                </table>
                <p>Proof of Delivery documentation is available upon request.</p>
                <p>Thank you for choosing Cox Transport & Logistics!</p>
            </body>
            </html>
            """
            
            try:
                send_email_sendgrid(
                    to=customer.email,
                    subject=f"Delivery Completed - Load {load.load_number}",
                    body=f"Your shipment (Load {load.load_number}) has been delivered.",
                    html=email_html
                )
                return {"success": True, "message": "Customer notified"}
            except Exception as e:
                return {"success": False, "error": str(e)}
    
    return {"success": False, "message": "No customer email found"}


@router.get("/templates")
def get_email_templates(
    current_user: User = Depends(get_current_user)
):
    """
    Get available email templates
    """
    templates = [
        {
            "id": "load_assigned",
            "name": "Load Assigned",
            "description": "Notify driver of new load assignment",
            "variables": ["driver_name", "load_number", "origin", "destination", "pickup_date", "rate"]
        },
        {
            "id": "invoice_sent",
            "name": "Invoice Sent",
            "description": "Send invoice to customer",
            "variables": ["customer_name", "invoice_number", "invoice_date", "due_date", "amount"]
        },
        {
            "id": "pod_submitted",
            "name": "POD Submitted",
            "description": "Notify customer of delivery completion",
            "variables": ["customer_name", "load_number", "delivery_location", "delivery_date"]
        },
        {
            "id": "payment_received",
            "name": "Payment Received",
            "description": "Thank customer for payment",
            "variables": ["customer_name", "invoice_number", "amount_paid", "payment_date"]
        }
    ]
    
    return templates


@router.get("/test/email")
def test_email_configuration(
    current_user: User = Depends(get_current_user)
):
    """
    Test email configuration by sending a test email
    """
    if not SENDGRID_API_KEY:
        return {
            "configured": False,
            "message": "SendGrid not configured. Set SENDGRID_API_KEY environment variable."
        }
    
    try:
        # Send test email to current user
        send_email_sendgrid(
            to=current_user.email,
            subject="MainTMS Email Test",
            body="This is a test email from MainTMS. Your email configuration is working correctly!",
            html="<html><body><h2>Email Test</h2><p>This is a test email from MainTMS. Your email configuration is working correctly!</p></body></html>"
        )
        
        return {
            "configured": True,
            "success": True,
            "message": f"Test email sent to {current_user.email}"
        }
    except Exception as e:
        return {
            "configured": True,
            "success": False,
            "error": str(e)
        }


@router.get("/test/sms")
def test_sms_configuration(
    phone_number: str,
    current_user: User = Depends(get_current_user)
):
    """
    Test SMS configuration by sending a test SMS
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return {
            "configured": False,
            "message": "Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN."
        }
    
    try:
        send_sms_twilio(
            to=phone_number,
            message="This is a test SMS from MainTMS. Your SMS configuration is working correctly!"
        )
        
        return {
            "configured": True,
            "success": True,
            "message": f"Test SMS sent to {phone_number}"
        }
    except Exception as e:
        return {
            "configured": True,
            "success": False,
            "error": str(e)
        }
