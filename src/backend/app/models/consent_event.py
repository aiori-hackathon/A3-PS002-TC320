import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from app.db.session import Base


class ConsentEvent(Base):
    __tablename__ = "consent_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(36), default=lambda: str(uuid.uuid4()), nullable=False, unique=True, index=True)
    user_id = Column(String(64), nullable=False, index=True)
    purpose_id = Column(String(64), nullable=False, index=True)
    action = Column(String(16), nullable=False)  # "GRANT" or "WITHDRAW"
    notice_version = Column(String(32), nullable=False)
    notice_hash = Column(String(64), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    metadata_json = Column(Text, nullable=True)

    __table_args__ = (
        Index("idx_user_purpose_timestamp", "user_id", "purpose_id", "timestamp"),
    )
