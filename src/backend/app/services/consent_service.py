from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.consent_event import ConsentEvent
from app.models.purpose import Purpose
from app.models.user import User
from app.schemas.consent import ConsentStateRead, UserConsentSummary
from app.services.audit_service import AuditService
from app.services.notice_service import NoticeService


class ConsentService:
    @staticmethod
    def get_latest_consent_event(
        db: Session,
        user_id: str,
        purpose_id: str,
    ) -> Optional[ConsentEvent]:
        """Fetches the most recent append-only consent event for a given user and purpose."""
        return (
            db.query(ConsentEvent)
            .filter(
                ConsentEvent.user_id == user_id,
                ConsentEvent.purpose_id == purpose_id,
            )
            .order_by(desc(ConsentEvent.id))
            .first()
        )

    @staticmethod
    def get_user_consent_summary(db: Session, user_id: str) -> UserConsentSummary:
        """Derives the current consent states for all active purposes for the user."""
        current_notice = NoticeService.get_current_notice(db)
        if not current_notice:
            raise ValueError("No active privacy notice configured in the system.")

        purposes = db.query(Purpose).filter(Purpose.is_active == True).order_by(Purpose.id.asc()).all()
        states: List[ConsentStateRead] = []

        for p in purposes:
            latest_event = ConsentService.get_latest_consent_event(db, user_id, p.id)

            if latest_event is None:
                states.append(
                    ConsentStateRead(
                        purpose_id=p.id,
                        purpose_name=p.name,
                        purpose_description=p.description,
                        status="NO_CONSENT",
                        is_stale=False,
                        notice_version=None,
                        notice_hash=None,
                        last_updated=None,
                    )
                )
            elif latest_event.action == "WITHDRAW":
                states.append(
                    ConsentStateRead(
                        purpose_id=p.id,
                        purpose_name=p.name,
                        purpose_description=p.description,
                        status="WITHDRAWN",
                        is_stale=False,
                        notice_version=latest_event.notice_version,
                        notice_hash=latest_event.notice_hash,
                        last_updated=latest_event.timestamp,
                    )
                )
            else:  # GRANT
                is_stale = latest_event.notice_hash != current_notice.hash_sha256
                states.append(
                    ConsentStateRead(
                        purpose_id=p.id,
                        purpose_name=p.name,
                        purpose_description=p.description,
                        status="GRANTED",
                        is_stale=is_stale,
                        notice_version=latest_event.notice_version,
                        notice_hash=latest_event.notice_hash,
                        last_updated=latest_event.timestamp,
                    )
                )

        return UserConsentSummary(
            user_id=user_id,
            current_notice_version=current_notice.version,
            current_notice_hash=current_notice.hash_sha256,
            states=states,
        )

    @staticmethod
    def record_consent_action(
        db: Session,
        user_id: str,
        purpose_id: str,
        action: str,  # "GRANT" or "WITHDRAW"
    ) -> ConsentEvent:
        """Appends a new immutable consent event and logs to the audit hash chain."""
        # Validate user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} does not exist.")
        if not user.is_active:
            raise ValueError(f"User {user_id} is inactive.")

        # Validate purpose
        purpose = db.query(Purpose).filter(Purpose.id == purpose_id).first()
        if not purpose:
            raise ValueError(f"Purpose {purpose_id} does not exist.")
        if not purpose.is_active:
            raise ValueError(f"Purpose {purpose_id} is inactive.")

        # Get current active notice
        current_notice = NoticeService.get_current_notice(db)
        if not current_notice:
            raise ValueError("No active privacy notice configured in the system.")

        # Create new append-only consent event
        event = ConsentEvent(
            user_id=user_id,
            purpose_id=purpose_id,
            action=action.upper(),
            notice_version=current_notice.version,
            notice_hash=current_notice.hash_sha256,
            timestamp=datetime.utcnow(),
        )

        db.add(event)
        db.commit()
        db.refresh(event)

        # Log into the hash-chained audit trail
        AuditService.log_event(
            db=db,
            event_type="CONSENT_CHANGE",
            decision="RECORDED",
            reason_code=f"CONSENT_{action.upper()}ED",
            user_id=user_id,
            purpose_id=purpose_id,
            details={
                "action": action.upper(),
                "consent_event_id": event.event_id,
                "notice_version": current_notice.version,
                "notice_hash": current_notice.hash_sha256,
            },
        )

        return event

    @staticmethod
    def get_user_consent_history(
        db: Session,
        user_id: str,
        limit: int = 50,
    ) -> List[ConsentEvent]:
        """Returns the full historical sequence of append-only consent events for a user."""
        return (
            db.query(ConsentEvent)
            .filter(ConsentEvent.user_id == user_id)
            .order_by(desc(ConsentEvent.id))
            .limit(limit)
            .all()
        )
