"""
Email delivery, abstracted the same way as the iGOT/NSSTA integrations:
call sites depend only on `EmailProvider`, never on smtplib directly, so
swapping providers (or adding a transactional email API later) never
touches calling code.
"""

import logging
import smtplib
from abc import ABC, abstractmethod
from email.mime.text import MIMEText

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("app.email")


class EmailProvider(ABC):
    @abstractmethod
    def send(self, *, to_email: str, subject: str, body: str) -> None:
        ...


class MockEmailProvider(EmailProvider):
    """Logs the email instead of sending it — used for local dev without SMTP credentials."""

    def send(self, *, to_email: str, subject: str, body: str) -> None:
        logger.info(
            "\n--- MOCK EMAIL (EMAIL_MODE=mock, not actually sent) ---\n"
            "To: %s\nSubject: %s\n\n%s\n--- END MOCK EMAIL ---",
            to_email,
            subject,
            body,
        )


class SMTPEmailProvider(EmailProvider):
    def send(self, *, to_email: str, subject: str, body: str) -> None:
        if not settings.SMTP_HOST:
            raise RuntimeError("EMAIL_MODE=smtp but SMTP_HOST is not configured")

        message = MIMEText(body, "plain")
        message["Subject"] = subject
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        message["To"] = to_email

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], message.as_string())


def get_email_provider() -> EmailProvider:
    if settings.EMAIL_MODE == "smtp":
        return SMTPEmailProvider()
    return MockEmailProvider()
