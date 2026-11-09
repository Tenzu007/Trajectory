import json
from typing import Any, Optional
from sqlalchemy.orm import Session
from app.models.auth import AuditLog, User

def log_audit_event(
    db: Session,
    action: str,
    user: Optional[User] = None,
    entity_name: Optional[str] = None,
    entity_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[Any] = None,
) -> AuditLog:
    """Records security and administrative activity in the immutable audit log."""
    details_str = json.dumps(details) if isinstance(details, (dict, list)) else str(details or "")
    log_entry = AuditLog(
        user_id=user.id if user else None,
        action=action,
        entity_name=entity_name,
        entity_id=str(entity_id) if entity_id else None,
        ip_address=ip_address or "127.0.0.1",
        details=details_str,
    )
    db.add(log_entry)
    db.commit()
    return log_entry

