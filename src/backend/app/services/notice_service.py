from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.hash_chain import compute_notice_hash
from app.models.notice import PrivacyNotice
from app.services.audit_service import AuditService


class NoticeService:
    @staticmethod
    def get_current_notice(db: Session) -> Optional[PrivacyNotice]:
        return db.query(PrivacyNotice).filter(PrivacyNotice.is_current == True).first()

    @staticmethod
    def get_all_notices(db: Session) -> List[PrivacyNotice]:
        return db.query(PrivacyNotice).order_by(desc(PrivacyNotice.id)).all()

    @staticmethod
    def get_notice_by_version(db: Session, version: str) -> Optional[PrivacyNotice]:
        return db.query(PrivacyNotice).filter(PrivacyNotice.version == version).first()

    @staticmethod
    def publish_notice(
        db: Session,
        version: str,
        title: str,
        content: str,
    ) -> PrivacyNotice:
        # Check if version already exists
        existing = db.query(PrivacyNotice).filter(PrivacyNotice.version == version).first()
        if existing:
            raise ValueError(f"Notice version {version} already exists. Notice versions are immutable.")

        # Compute deterministic SHA-256 hash
        notice_hash = compute_notice_hash(version, title, content)

        # Deprecate current active notices
        db.query(PrivacyNotice).filter(PrivacyNotice.is_current == True).update({"is_current": False})

        new_notice = PrivacyNotice(
            version=version,
            title=title,
            content=content,
            hash_sha256=notice_hash,
            is_current=True,
            created_at=datetime.utcnow(),
        )

        db.add(new_notice)
        db.commit()
        db.refresh(new_notice)

        # Log to audit trail
        AuditService.log_event(
            db=db,
            event_type="NOTICE_PUBLISH",
            decision="RECORDED",
            reason_code="NOTICE_UPDATED",
            details={
                "version": version,
                "title": title,
                "hash_sha256": notice_hash,
            },
        )

        return new_notice
