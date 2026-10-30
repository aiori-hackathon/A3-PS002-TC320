from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.consent import (
    ConsentActionRequest,
    ConsentEventRead,
    UserConsentSummary,
)
from app.services.consent_service import ConsentService

router = APIRouter(prefix="/consent", tags=["Consent Management"])


@router.get("/state", response_model=UserConsentSummary)
def get_user_consent_state(
    user_id: str = Query(..., description="ID of the user, e.g. user_001"),
    db: Session = Depends(get_db),
):
    """
    Derives the live purpose-specific consent state for the specified user,
    evaluating staleness against the current privacy notice version.
    """
    try:
        return ConsentService.get_user_consent_summary(db, user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/grant", response_model=ConsentEventRead, status_code=status.HTTP_201_CREATED)
def grant_consent(
    payload: ConsentActionRequest,
    db: Session = Depends(get_db),
):
    """
    Records an append-only GRANT consent event under the current active notice version.
    Never mutates historical events.
    """
    try:
        event = ConsentService.record_consent_action(
            db=db,
            user_id=payload.user_id,
            purpose_id=payload.purpose_id,
            action="GRANT",
        )
        return event
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/withdraw", response_model=ConsentEventRead, status_code=status.HTTP_201_CREATED)
def withdraw_consent(
    payload: ConsentActionRequest,
    db: Session = Depends(get_db),
):
    """
    Records an append-only WITHDRAW consent event.
    Immediately blocks subsequent data access requests.
    """
    try:
        event = ConsentService.record_consent_action(
            db=db,
            user_id=payload.user_id,
            purpose_id=payload.purpose_id,
            action="WITHDRAW",
        )
        return event
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/history", response_model=List[ConsentEventRead])
def get_consent_history(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Returns the immutable append-only event stream for this user."""
    return ConsentService.get_user_consent_history(db, user_id=user_id, limit=limit)
