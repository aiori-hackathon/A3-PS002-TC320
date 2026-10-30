from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.audit import AuditEventRead, AuditVerifyResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit", tags=["Audit & Evidence Trail"])


@router.get("/events", response_model=List[AuditEventRead])
def list_audit_events(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user_id: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    decision: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Returns sequential hash-chained audit events."""
    return AuditService.get_events(
        db=db,
        limit=limit,
        offset=offset,
        user_id=user_id,
        event_type=event_type,
        decision=decision,
    )


@router.get("/verify", response_model=AuditVerifyResponse)
def verify_audit_chain(db: Session = Depends(get_db)):
    """
    Cryptographically verifies the SHA-256 hash chain across all recorded audit entries.
    Detects any payload modification, sequence discontinuity, or broken hash linkages.
    """
    is_valid, total, latest_hash, broken_seq, error_msg = AuditService.verify_chain(db)
    return AuditVerifyResponse(
        is_valid=is_valid,
        total_records=total,
        latest_hash=latest_hash,
        verified_at=datetime.utcnow(),
        broken_at_sequence=broken_seq,
        error_message=error_msg,
    )


@router.get("/export")
def export_audit_trail(
    format: str = Query("json", pattern="^(json|csv)$"),
    db: Session = Depends(get_db),
):
    """Exports the tamper-evident audit evidence trail as JSON or CSV."""
    if format == "csv":
        csv_data = AuditService.export_csv(db)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=fittrack_audit_log.csv"},
        )
    else:
        json_data = AuditService.export_json(db)
        return Response(
            content=json_data,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=fittrack_audit_log.json"},
        )
