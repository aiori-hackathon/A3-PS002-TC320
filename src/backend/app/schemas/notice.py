from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class NoticeCreate(BaseModel):
    version: str = Field(..., min_length=1, max_length=32, description="e.g. v2.0")
    title: str = Field(..., min_length=1, max_length=256)
    content: str = Field(..., min_length=1, description="Full text of the privacy notice")


class NoticeRead(BaseModel):
    id: int
    version: str
    title: str
    content: str
    hash_sha256: str
    is_current: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
