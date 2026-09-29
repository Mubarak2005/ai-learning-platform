"""Phase 12 — audit logging for security-relevant actions."""

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.misc import AuditLog


def record_audit_event(
    db: Session,
    *,
    action: str,
    user_id: Optional[UUID] = None,
    detail: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> None:
    db.add(AuditLog(user_id=user_id, action=action, detail=detail, ip_address=ip_address))
    db.commit()
