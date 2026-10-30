from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.db.session import Base


class PrivacyNotice(Base):
    __tablename__ = "privacy_notices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    version = Column(String(32), nullable=False, unique=True, index=True)
    title = Column(String(256), nullable=False)
    content = Column(Text, nullable=False)
    hash_sha256 = Column(String(64), nullable=False, index=True)
    is_current = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
