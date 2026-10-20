from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    id: str
    name: str
    email: str
    is_active: bool = True


class UserRead(UserBase):
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
