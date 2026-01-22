import smtplib
from email.message import EmailMessage
from app.core.config import settings


def send_email(subject: str, body: str, to_address: str) -> None:
    if not settings.smtp_host:
        return
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_user
    message["To"] = to_address
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port or 587) as server:
        server.starttls()
        if settings.smtp_user and settings.smtp_pass:
            server.login(settings.smtp_user, settings.smtp_pass)
        server.send_message(message)
