import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.security import verify_admin_key
from app.db.session import get_db
from app.models.audit_event import AuditEvent
from app.schemas.audit import AuditVerifyResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/admin", tags=["Administrative & Demonstration"])


@router.post("/tamper-test")
def simulate_tampering(
    tamper_type: str = Query("payload", pattern="^(payload|hash_link)$"),
    db: Session = Depends(get_db),
    authorized: bool = Depends(verify_admin_key),
):
    """
    Demonstration endpoint: intentionally tampers with an existing audit record
    to verify that the audit verification engine detects tampering.
    """
    last_event = db.query(AuditEvent).order_by(desc(AuditEvent.sequence_number)).first()
    if not last_event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No audit records available to tamper with",
        )

    if tamper_type == "payload":
        # Modify payload text without recomputing payload_hash
        try:
            payload = json.loads(last_event.payload_json)
            payload["TAMPERED_BY_ATTACKER"] = True
            payload["details"]["modified_unauthorized"] = "malicious change"
            last_event.payload_json = json.dumps(payload, sort_keys=True)
            db.commit()
            return {
                "message": f"Successfully tampered with payload at sequence {last_event.sequence_number}",
                "sequence_number": last_event.sequence_number,
                "tamper_type": "payload",
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        # Corrupt current_hash
        last_event.current_hash = "deadbeef" * 8
        db.commit()
        return {
            "message": f"Successfully corrupted hash at sequence {last_event.sequence_number}",
            "sequence_number": last_event.sequence_number,
            "tamper_type": "hash_link",
        }
