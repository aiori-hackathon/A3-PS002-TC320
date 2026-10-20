from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class DataAccessRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=64)
    purpose: str = Field(..., min_length=1, max_length=64)


class DataAccessResponse(BaseModel):
    status: str = "ALLOWED"
    reason_code: str = "CONSENT_ACTIVE"
    user_id: str
    purpose: str
    timestamp: datetime
    data: Dict[str, Any]


class DataAccessDeniedDetail(BaseModel):
    status: str = "DENIED"
    reason_code: str
    message: str
    user_id: str
    purpose: str
