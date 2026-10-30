import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from app.db.session import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"

    sequence_number = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(36), default=lambda: str(uuid.uuid4()), nullable=False, unique=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    event_type = Column(String(32), nullable=False, index=True)  # e.g., "CONSENT_CHANGE", "DATA_ACCESS", "NOTICE_PUBLISH"
    user_id = Column(String(64), nullable=True, index=True)
    purpose_id = Column(String(64), nullable=True, index=True)
    decision = Column(String(16), nullable=False)  # "ALLOW", "DENY", "RECORDED"
    reason_code = Column(String(64), nullable=False)
    payload_json = Column(Text, nullable=False)
    payload_hash = Column(String(64), nullable=False)
    prev_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False, index=True)
