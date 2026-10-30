from typing import Tuple, Optional
from sqlalchemy.orm import Session

from app.models.consent_event import ConsentEvent
from app.models.purpose import Purpose
from app.models.user import User
from app.services.consent_service import ConsentService
from app.services.notice_service import NoticeService


class AuthorizationResult:
    def __init__(self, is_authorized: bool, reason_code: str, message: str):
        self.is_authorized = is_authorized
        self.reason_code = reason_code
        self.message = message


class AuthorizationService:
    @staticmethod
    def evaluate_access(
        db: Session,
        user_id: str,
        purpose_id: str,
    ) -> AuthorizationResult:
        """
        Server-side authoritative evaluation of purpose-based access.
        Evaluates user existence, user active status, purpose existence, purpose active status,
        and latest consent event under current notice version.
        """
        # 1. Validate User
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return AuthorizationResult(
                is_authorized=False,
                reason_code="UNKNOWN_USER",
                message=f"Access denied: User '{user_id}' does not exist in the system.",
            )
        if not user.is_active:
            return AuthorizationResult(
                is_authorized=False,
                reason_code="INACTIVE_USER",
                message=f"Access denied: User '{user_id}' account is deactivated.",
            )

        # 2. Validate Purpose
        purpose = db.query(Purpose).filter(Purpose.id == purpose_id).first()
        if not purpose:
            return AuthorizationResult(
                is_authorized=False,
                reason_code="UNKNOWN_PURPOSE",
                message=f"Access denied: Purpose '{purpose_id}' is not recognized.",
            )
        if not purpose.is_active:
            return AuthorizationResult(
                is_authorized=False,
                reason_code="INACTIVE_PURPOSE",
                message=f"Access denied: Purpose '{purpose_id}' is inactive or retired.",
            )

        # 3. Check Current Privacy Notice
        current_notice = NoticeService.get_current_notice(db)
        if not current_notice:
            return AuthorizationResult(
                is_authorized=False,
                reason_code="NO_ACTIVE_NOTICE",
                message="Access denied: No active privacy notice is currently configured.",
            )

        # 4. Check Latest Consent Event
        latest_event: Optional[ConsentEvent] = ConsentService.get_latest_consent_event(db, user_id, purpose_id)

        if not latest_event:
            return AuthorizationResult(
                is_authorized=False,
                reason_code="NO_CONSENT",
                message=f"Access denied: No consent record found for purpose '{purpose_id}'.",
            )

        if latest_event.action == "WITHDRAW":
            return AuthorizationResult(
                is_authorized=False,
                reason_code="CONSENT_WITHDRAWN",
                message=f"Access denied: Consent has been explicitly withdrawn for purpose '{purpose_id}'.",
            )

        # Action is GRANT: Check notice hash freshness
        if latest_event.notice_hash != current_notice.hash_sha256:
            return AuthorizationResult(
                is_authorized=False,
                reason_code="CONSENT_STALE",
                message=(
                    f"Access denied: Consent was granted under privacy notice version '{latest_event.notice_version}', "
                    f"which is superseded by current notice version '{current_notice.version}'. Re-consent required."
                ),
            )

        # All checks passed
        return AuthorizationResult(
            is_authorized=True,
            reason_code="CONSENT_ACTIVE",
            message=f"Access granted: Active informed consent verified under notice '{current_notice.version}'.",
        )
