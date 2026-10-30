from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserRead])
def get_users(db: Session = Depends(get_db)):
    """Returns list of synthetic demo users."""
    return db.query(User).order_by(User.id.asc()).all()
