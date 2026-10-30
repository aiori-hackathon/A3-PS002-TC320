from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.purpose import Purpose
from app.schemas.purpose import PurposeRead

router = APIRouter(prefix="/purposes", tags=["Purposes"])


@router.get("", response_model=List[PurposeRead])
def get_purposes(db: Session = Depends(get_db)):
    """Returns list of itemized processing purposes."""
    return db.query(Purpose).order_by(Purpose.id.asc()).all()
