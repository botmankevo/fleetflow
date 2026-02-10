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
    
    @staticmethod
    def send_settlement_created_notification(driver_email: str, driver_name: str, settlement_id: int, period_start: str, period_end: str, total_amount: float) -> bool:
        """Notify driver that a settlement has been created."""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                .amount {{ font-size: 32px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }}
                .details {{ background-color: white; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }}
                .button {{ display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>New Settlement Created</h1></div>
                <div class="content">
                    <p>Hi {driver_name},</p>
                    <p>A new payroll settlement has been created for you:</p>
                    <div class="amount">${total_amount:,.2f}</div>
                    <div class="details">
                        <strong>Settlement Details:</strong><br>
                        Settlement ID: #{settlement_id}<br>
                        Period: {period_start} - {period_end}<br>
                        Status: Draft (pending approval)
                    </div>
                    <p>You will receive another notification once it has been approved and paid.</p>
                    <center><a href="http://localhost:3000/driver/pay-history" class="button">View Pay History</a></center>
                </div>
                <div class="footer">MainTMS Payroll System</div>
            </div>
        </body>
        </html>
        """
        return EmailService.send_email(driver_email, f"New Payroll Settlement #{settlement_id} Created", html_content)
    
    @staticmethod
    def send_settlement_approved_notification(driver_email: str, driver_name: str, settlement_id: int, total_amount: float) -> bool:
        """Notify driver that their settlement has been approved."""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                .amount {{ font-size: 32px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }}
                .status {{ background-color: #d1fae5; color: #065f46; padding: 10px; border-radius: 6px; text-align: center; font-weight: bold; }}
                .button {{ display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>✓ Settlement Approved</h1></div>
                <div class="content">
                    <p>Hi {driver_name},</p>
                    <p>Great news! Your payroll settlement has been approved:</p>
                    <div class="amount">${total_amount:,.2f}</div>
                    <div class="status">APPROVED - Payment Processing</div>
                    <p style="margin-top: 20px;">Your payment is now being processed. You will receive a final notification once the payment has been issued.</p>
                    <center><a href="http://localhost:3000/driver/pay-history" class="button">View Settlement Details</a></center>
                </div>
                <div class="footer">MainTMS Payroll System</div>
            </div>
        </body>
        </html>
        """
        return EmailService.send_email(driver_email, f"Payroll Settlement #{settlement_id} Approved", html_content)
    
    @staticmethod
    def send_settlement_paid_notification(driver_email: str, driver_name: str, settlement_id: int, total_amount: float, paid_date: str, line_count: int) -> bool:
        """Notify driver that their settlement has been paid."""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                .amount {{ font-size: 42px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }}
                .status {{ background-color: #059669; color: white; padding: 15px; border-radius: 6px; text-align: center; font-weight: bold; font-size: 18px; }}
                .details {{ background-color: white; padding: 15px; border-left: 4px solid #059669; margin: 20px 0; }}
                .button {{ display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>💰 Payment Issued!</h1></div>
                <div class="content">
                    <p>Hi {driver_name},</p>
                    <p>Your payment has been issued:</p>
                    <div class="amount">${total_amount:,.2f}</div>
                    <div class="status">✓ PAID</div>
                    <div class="details">
                        <strong>Payment Details:</strong><br>
                        Settlement ID: #{settlement_id}<br>
                        Paid Date: {paid_date}<br>
                        Line Items: {line_count}<br>
                        Status: Paid & Finalized
                    </div>
                    <p>Your payment should appear in your account within 1-3 business days.</p>
                    <p><strong>Note:</strong> This settlement is now finalized. Any future adjustments will appear in your next pay period.</p>
                    <center><a href="http://localhost:3000/driver/pay-history" class="button">View Full Statement</a></center>
                </div>
                <div class="footer">MainTMS Payroll System | Thank you for your hard work!</div>
            </div>
        </body>
        </html>
        """
        return EmailService.send_email(driver_email, f"💰 Payment Issued - Settlement #{settlement_id}", html_content)
    
    @staticmethod
    def send_adjustment_created_notification(driver_email: str, driver_name: str, load_number: str, adjustment_amount: float, description: str) -> bool:
        """Notify driver that an adjustment has been created."""
        adjustment_type = "increase" if adjustment_amount > 0 else "decrease"
        color = "#059669" if adjustment_amount > 0 else "#dc2626"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                .amount {{ font-size: 32px; font-weight: bold; color: {color}; text-align: center; margin: 20px 0; }}
                .details {{ background-color: white; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }}
                .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>Pay Adjustment Notice</h1></div>
                <div class="content">
                    <p>Hi {driver_name},</p>
                    <p>A pay adjustment has been created for Load {load_number}:</p>
                    <div class="amount">{"+" if adjustment_amount > 0 else ""}{adjustment_amount:,.2f}</div>
                    <div class="details">
                        <strong>Adjustment Details:</strong><br>
                        Load: {load_number}<br>
                        Type: {adjustment_type.title()}<br>
                        Reason: {description}
                    </div>
                    <p>This adjustment will be included in your next pay period.</p>
                    <p><strong>Why adjustments happen:</strong> When a settlement is paid, those pay lines are locked. If the load details change afterwards, we create an adjustment line for your next settlement.</p>
                </div>
                <div class="footer">MainTMS Payroll System</div>
            </div>
        </body>
        </html>
        """
        return EmailService.send_email(driver_email, f"Pay Adjustment Created - Load {load_number}", html_content)
    
    @staticmethod
    def send_batch_settlement_summary(admin_email: str, settlement_count: int, total_amount: float, payee_names: list) -> bool:
        """Send summary email to admin after batch settlement creation."""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                .total {{ font-size: 32px; font-weight: bold; color: #7c3aed; text-align: center; margin: 20px 0; }}
                .details {{ background-color: white; padding: 15px; border-left: 4px solid #7c3aed; margin: 20px 0; }}
                .button {{ display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>Batch Settlements Created</h1></div>
                <div class="content">
                    <p>Batch settlement creation completed successfully:</p>
                    <div class="total">${total_amount:,.2f}</div>
                    <div class="details">
                        <strong>Batch Summary:</strong><br>
                        Settlements Created: {settlement_count}<br>
                        Total Amount: ${total_amount:,.2f}<br>
                        <br>
                        <strong>Payees:</strong><br>
                        {', '.join(payee_names[:5])}{' and ' + str(len(payee_names) - 5) + ' more' if len(payee_names) > 5 else ''}
                    </div>
                    <p>All settlements are in draft status and ready for review.</p>
                    <center><a href="http://localhost:3000/admin/payroll" class="button">Review Settlements</a></center>
                </div>
                <div class="footer">MainTMS Payroll System</div>
            </div>
        </body>
        </html>
        """
        return EmailService.send_email(admin_email, f"Batch Settlements Created: {settlement_count} settlements", html_content)
