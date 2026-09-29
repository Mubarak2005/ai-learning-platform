"""
OTP lifecycle: generate a code, store only its hash, email it, and later
verify a user-submitted code against that hash with expiry and attempt
limits. Kept separate from the route layer so both the "verify email" and
"reset password" flows share identical, tested logic.
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.auth import OtpCode, OtpPurpose
from app.models.user import User
from app.services.email_service import get_email_provider

settings = get_settings()


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _generate_numeric_code(length: int) -> str:
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


EMAIL_TEMPLATES = {
    OtpPurpose.EMAIL_VERIFICATION: {
        "subject": "Verify your email — AI Learning Platform",
        "body": (
            "Your email verification code is: {code}\n\n"
            "This code expires in {minutes} minutes. If you did not request "
            "this, you can safely ignore this email."
        ),
    },
    OtpPurpose.PASSWORD_RESET: {
        "subject": "Password reset code — AI Learning Platform",
        "body": (
            "Your password reset code is: {code}\n\n"
            "This code expires in {minutes} minutes. If you did not request "
            "a password reset, you can safely ignore this email."
        ),
    },
}


def issue_otp(db: Session, *, user: User, purpose: OtpPurpose) -> OtpCode:
    """Generates a new OTP, invalidates any previous unconsumed ones for the
    same purpose, stores the hash, and emails the plaintext code."""

    # Invalidate old, unconsumed codes for this purpose so only the latest is valid.
    stale = (
        db.query(OtpCode)
        .filter(
            OtpCode.user_id == user.id,
            OtpCode.purpose == purpose,
            OtpCode.consumed_at.is_(None),
        )
        .all()
    )
    now = datetime.now(timezone.utc)
    for row in stale:
        row.consumed_at = now
        db.add(row)

    code = _generate_numeric_code(settings.OTP_LENGTH)
    record = OtpCode(
        user_id=user.id,
        purpose=purpose,
        code_hash=_hash_code(code),
        expires_at=now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    template = EMAIL_TEMPLATES[purpose]
    get_email_provider().send(
        to_email=user.email,
        subject=template["subject"],
        body=template["body"].format(code=code, minutes=settings.OTP_EXPIRE_MINUTES),
    )

    return record


class OtpVerificationError(Exception):
    """Raised with a human-readable reason: expired, invalid, or too many attempts."""


def verify_otp(db: Session, *, user: User, purpose: OtpPurpose, code: str) -> None:
    record = (
        db.query(OtpCode)
        .filter(
            OtpCode.user_id == user.id,
            OtpCode.purpose == purpose,
            OtpCode.consumed_at.is_(None),
        )
        .order_by(OtpCode.created_at.desc())
        .first()
    )

    if not record:
        raise OtpVerificationError("No active code found. Please request a new one.")

    now = datetime.now(timezone.utc)
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        raise OtpVerificationError("This code has expired. Please request a new one.")

    if record.attempts >= settings.OTP_MAX_ATTEMPTS:
        raise OtpVerificationError("Too many incorrect attempts. Please request a new code.")

    if _hash_code(code) != record.code_hash:
        record.attempts += 1
        db.add(record)
        db.commit()
        raise OtpVerificationError("Incorrect code. Please try again.")

    record.consumed_at = now
    db.add(record)
    db.commit()
