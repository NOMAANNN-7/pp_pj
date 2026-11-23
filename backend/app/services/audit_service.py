import json
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Any
from backend.app.models.audit import AuditLog

def log_activity(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str],
    description: str,
    details: Optional[Any] = None
) -> AuditLog:
    details_str = None
    if details:
        try:
            details_str = json.dumps(details, default=str)
        except Exception:
            details_str = str(details)

    audit_entry = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        description=description,
        details_json=details_str,
        timestamp=datetime.utcnow()
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry
