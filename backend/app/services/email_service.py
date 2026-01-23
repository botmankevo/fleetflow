import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


class EmailService:
    """Service for sending emails."""
    
    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str) -> bool:
        """Send email via SMTP."""
        if not settings.SMTP_HOST:
            print(f"[STUB] Would send email to {to_email}: {subject}")
            return True
        
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM
            msg["To"] = to_email
            
            part = MIMEText(html_content, "html")
            msg.attach(part)
            
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASS:
                    server.login(settings.SMTP_USER, settings.SMTP_PASS)
                server.sendmail(settings.SMTP_FROM, [to_email], msg.as_string())
            
            return True
        except Exception as e:
            print(f"Email send failed: {str(e)}")
            return False
    
    @staticmethod
    def send_pod_notification(
        recipient_email: str,
        load_number: str,
        receiver_name: str,
        pdf_link: str
    ) -> bool:
        """Send POD submission notification."""
        html_content = f"""
        <h2>Proof of Delivery Submitted</h2>
        <p>A new POD has been submitted:</p>
        <ul>
            <li><strong>Load:</strong> {load_number}</li>
            <li><strong>Receiver:</strong> {receiver_name}</li>
            <li><strong>PDF:</strong> <a href="{pdf_link}">View POD</a></li>
        </ul>
        <p>Login to FleetFlow to review details.</p>
        """
        return EmailService.send_email(
            recipient_email,
            f"POD Submitted - Load {load_number}",
            html_content
        )
