from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ConsentActionRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=64)
    purpose_id: str = Field(..., min_length=1, max_length=64)


class ConsentStateRead(BaseModel):
    purpose_id: str
    purpose_name: str
    purpose_description: str
    status: str  # "GRANTED", "WITHDRAWN", "NO_CONSENT"
    is_stale: bool
    notice_version: Optional[str] = None
    notice_hash: Optional[str] = None
    last_updated: Optional[datetime] = None


class UserConsentSummary(BaseModel):
    user_id: str
    current_notice_version: str
    current_notice_hash: str
    states: List[ConsentStateRead]


class ConsentEventRead(BaseModel):
    id: int
    event_id: str
    user_id: str
    purpose_id: str
    action: str
    notice_version: str
    notice_hash: str
    timestamp: datetime
    metadata_json: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
