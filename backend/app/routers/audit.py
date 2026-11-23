from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional
from backend.app.database import get_db
from backend.app.models.audit import AuditLog

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])

@router.get("")
def get_audit_logs(
    search: Optional[str] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(AuditLog.description).like(s),
                func.lower(AuditLog.activity_id).like(s),
                func.lower(AuditLog.entity_id).like(s)
            )
        )

    if action:
        query = query.filter(AuditLog.action == action.upper())

    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type.upper())

    total = query.count()
    offset = (page - 1) * page_size
    logs = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(page_size).all()

    items = [
        {
            "id": l.id,
            "activity_id": l.activity_id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "description": l.description,
            "details_json": l.details_json,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        }
        for l in logs
    ]

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
