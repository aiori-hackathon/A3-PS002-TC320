from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class AuditEventRead(BaseModel):
    sequence_number: int
    event_id: str
    timestamp: datetime
    event_type: str
    user_id: Optional[str] = None
    purpose_id: Optional[str] = None
    decision: str
    reason_code: str
    payload_json: str
    payload_hash: str
    prev_hash: str
    current_hash: str

    model_config = ConfigDict(from_attributes=True)


class AuditVerifyResponse(BaseModel):
    is_valid: bool
    total_records: int
    latest_hash: Optional[str] = None
    verified_at: datetime
    broken_at_sequence: Optional[int] = None
    error_message: Optional[str] = None
