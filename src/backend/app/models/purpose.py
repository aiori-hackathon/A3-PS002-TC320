from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text
from app.db.session import Base


class Purpose(Base):
    __tablename__ = "purposes"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), default="standard", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
