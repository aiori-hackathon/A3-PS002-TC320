import csv
import io
import json
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.hash_chain import (
    GENESIS_HASH,
    compute_audit_payload_hash,
    compute_chained_hash,
)
from app.models.audit_event import AuditEvent

# Lock to strictly serialize sequential writes to the audit hash chain
_audit_lock = threading.Lock()


class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        event_type: str,
        decision: str,
        reason_code: str,
        user_id: Optional[str] = None,
        purpose_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditEvent:
        """
        Appends a new immutable audit record to the sequential SHA-256 hash chain.
        Safely serialized with an in-process lock and DB transaction.
        """
        with _audit_lock:
            # Find the most recent record to link to
            last_event = (
                db.query(AuditEvent)
                .order_by(desc(AuditEvent.sequence_number))
                .first()
            )

            if last_event is None:
                next_seq = 1
                prev_hash = GENESIS_HASH
            else:
                next_seq = last_event.sequence_number + 1
                prev_hash = last_event.current_hash

            now = datetime.utcnow()
            payload = {
                "sequence_number": next_seq,
                "timestamp": now.isoformat() + "Z",
                "event_type": event_type,
                "user_id": user_id,
                "purpose_id": purpose_id,
                "decision": decision,
                "reason_code": reason_code,
                "details": details or {},
            }

            payload_hash = compute_audit_payload_hash(payload)
            current_hash = compute_chained_hash(prev_hash, payload_hash)

            audit_entry = AuditEvent(
                sequence_number=next_seq,
                timestamp=now,
                event_type=event_type,
                user_id=user_id,
                purpose_id=purpose_id,
                decision=decision,
                reason_code=reason_code,
                payload_json=json.dumps(payload, sort_keys=True),
                payload_hash=payload_hash,
                prev_hash=prev_hash,
                current_hash=current_hash,
            )

            db.add(audit_entry)
            db.commit()
            db.refresh(audit_entry)
            return audit_entry

    @staticmethod
    def get_events(
        db: Session,
        limit: int = 100,
        offset: int = 0,
        user_id: Optional[str] = None,
        event_type: Optional[str] = None,
        decision: Optional[str] = None,
    ) -> List[AuditEvent]:
        query = db.query(AuditEvent)
        if user_id:
            query = query.filter(AuditEvent.user_id == user_id)
        if event_type:
            query = query.filter(AuditEvent.event_type == event_type)
        if decision:
            query = query.filter(AuditEvent.decision == decision)
        return query.order_by(desc(AuditEvent.sequence_number)).offset(offset).limit(limit).all()

    @staticmethod
    def get_total_count(db: Session) -> int:
        return db.query(AuditEvent).count()

    @staticmethod
    def verify_chain(db: Session) -> Tuple[bool, int, Optional[str], Optional[int], Optional[str]]:
        """
        Cryptographically verifies the entire audit hash chain:
        1. Sequence numbering is contiguous 1..N.
        2. First record links to GENESIS_HASH.
        3. Every record links to previous record's current_hash.
        4. Recomputed payload_hash matches stored payload_hash.
        5. Recomputed current_hash matches stored current_hash.
        Returns: (is_valid, total_records, latest_hash, broken_at_sequence, error_message)
        """
        records = db.query(AuditEvent).order_by(AuditEvent.sequence_number.asc()).all()
        total = len(records)
        if total == 0:
            return True, 0, GENESIS_HASH, None, None

        expected_seq = 1
        expected_prev_hash = GENESIS_HASH

        for record in records:
            if record.sequence_number != expected_seq:
                return (
                    False,
                    total,
                    None,
                    record.sequence_number,
                    f"Sequence break: expected sequence {expected_seq}, found {record.sequence_number}",
                )

            if record.prev_hash != expected_prev_hash:
                return (
                    False,
                    total,
                    None,
                    record.sequence_number,
                    f"Hash linkage broken at sequence {record.sequence_number}: expected prev_hash {expected_prev_hash}, found {record.prev_hash}",
                )

            # Re-verify payload hash
            try:
                payload = json.loads(record.payload_json)
                recomputed_payload_hash = compute_audit_payload_hash(payload)
                if recomputed_payload_hash != record.payload_hash:
                    return (
                        False,
                        total,
                        None,
                        record.sequence_number,
                        f"Payload tampering detected at sequence {record.sequence_number}: stored payload_hash {record.payload_hash} does not match computed {recomputed_payload_hash}",
                    )
            except Exception as e:
                return (
                    False,
                    total,
                    None,
                    record.sequence_number,
                    f"Corrupted payload JSON at sequence {record.sequence_number}: {str(e)}",
                )

            # Re-verify current hash
            recomputed_current_hash = compute_chained_hash(record.prev_hash, record.payload_hash)
            if recomputed_current_hash != record.current_hash:
                return (
                    False,
                    total,
                    None,
                    record.sequence_number,
                    f"Current record hash mismatch at sequence {record.sequence_number}: stored {record.current_hash} does not match computed {recomputed_current_hash}",
                )

            expected_prev_hash = record.current_hash
            expected_seq += 1

        return True, total, records[-1].current_hash, None, None

    @staticmethod
    def export_json(db: Session) -> str:
        records = db.query(AuditEvent).order_by(AuditEvent.sequence_number.asc()).all()
        data = []
        for r in records:
            data.append({
                "sequence_number": r.sequence_number,
                "event_id": r.event_id,
                "timestamp": r.timestamp.isoformat() + "Z",
                "event_type": r.event_type,
                "user_id": r.user_id,
                "purpose_id": r.purpose_id,
                "decision": r.decision,
                "reason_code": r.reason_code,
                "payload": json.loads(r.payload_json),
                "payload_hash": r.payload_hash,
                "prev_hash": r.prev_hash,
                "current_hash": r.current_hash,
            })
        return json.dumps(data, indent=2)

    @staticmethod
    def export_csv(db: Session) -> str:
        records = db.query(AuditEvent).order_by(AuditEvent.sequence_number.asc()).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "sequence_number",
            "event_id",
            "timestamp",
            "event_type",
            "user_id",
            "purpose_id",
            "decision",
            "reason_code",
            "payload_hash",
            "prev_hash",
            "current_hash",
        ])
        for r in records:
            writer.writerow([
                r.sequence_number,
                r.event_id,
                r.timestamp.isoformat() + "Z",
                r.event_type,
                r.user_id or "",
                r.purpose_id or "",
                r.decision,
                r.reason_code,
                r.payload_hash,
                r.prev_hash,
                r.current_hash,
            ])
        return output.getvalue()
