from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from backend.app.database import Base
import uuid

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    action = Column(String(50), index=True, nullable=False)
    entity_type = Column(String(50), index=True, nullable=False)
    entity_id = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    description = Column(Text, nullable=False)
    details_json = Column(Text, nullable=True)
