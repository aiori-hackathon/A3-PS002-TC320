from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PurposeBase(BaseModel):
    id: str
    name: str
    description: str
    category: str = "standard"
    is_active: bool = True


class PurposeRead(PurposeBase):
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
