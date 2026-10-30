from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import verify_admin_key
from app.db.session import get_db
from app.schemas.notice import NoticeCreate, NoticeRead
from app.services.notice_service import NoticeService

router = APIRouter(prefix="/notices", tags=["Privacy Notices"])


@router.get("/current", response_model=NoticeRead)
def get_current_notice(db: Session = Depends(get_db)):
    """Retrieves the active privacy notice version and its SHA-256 hash."""
    notice = NoticeService.get_current_notice(db)
    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active privacy notice found"
        )
    return notice


@router.get("", response_model=List[NoticeRead])
def list_notices(db: Session = Depends(get_db)):
    """Lists historical and current privacy notice versions."""
    return NoticeService.get_all_notices(db)


@router.post("", response_model=NoticeRead, status_code=status.HTTP_201_CREATED)
def publish_notice(
    payload: NoticeCreate,
    db: Session = Depends(get_db),
    authorized: bool = Depends(verify_admin_key),
):
    """
    Administrator endpoint: publishes a new version of the privacy notice.
    Supersedes prior notices and computes SHA-256 hash.
    Prior consents become STALE under this new notice.
    """
    try:
        notice = NoticeService.publish_notice(
            db=db,
            version=payload.version,
            title=payload.title,
            content=payload.content,
        )
        return notice
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
