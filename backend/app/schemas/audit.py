from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: int
    activity_id: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    timestamp: datetime
    description: str
    details_json: Optional[str] = None

    class Config:
        from_attributes = True
