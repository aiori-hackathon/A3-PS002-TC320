from sqlalchemy.orm import Session
from datetime import datetime

from app.core.hash_chain import compute_notice_hash
from app.db.session import engine, Base
from app.models.user import User
from app.models.purpose import Purpose
from app.models.notice import PrivacyNotice
from app.services.audit_service import AuditService


def init_db(db: Session) -> None:
    # Create all database tables
    Base.metadata.create_all(bind=engine)

    # 1. Seed Users
    existing_users = db.query(User).count()
    if existing_users == 0:
        users = [
            User(id="user_001", name="Alex Morgan", email="alex.morgan@example.com", is_active=True),
            User(id="user_002", name="Taylor Swift", email="taylor.s@example.com", is_active=True),
            User(id="user_003", name="Jordan Lee", email="jordan.lee@example.com", is_active=True),
            User(id="user_004", name="Casey Kim", email="casey.kim@example.com", is_active=True),
            User(id="user_005", name="Sam Patel", email="sam.patel@example.com", is_active=True),
            User(id="user_inactive", name="Inactive User", email="inactive.demo@example.com", is_active=False),
        ]
        db.add_all(users)
        db.commit()

    # 2. Seed Purposes
    existing_purposes = db.query(Purpose).count()
    if existing_purposes == 0:
        purposes = [
            Purpose(
                id="fitness_analytics",
                name="Fitness Analytics & Metrics",
                description="Collection and processing of daily steps, heart rate variability, calorie burn, and exercise patterns to compute performance insights.",
                category="telemetry",
                is_active=True,
            ),
            Purpose(
                id="personalized_recommendations",
                name="Personalized Recommendations",
                description="Analysis of biometric activity data to deliver tailored workout routines, recovery suggestions, and nutrition guidelines.",
                category="enhancement",
                is_active=True,
            ),
            Purpose(
                id="marketing",
                name="Marketing & Wellness Communications",
                description="Transmission of promotional updates, fitness gear discounts, and community event invitations.",
                category="commercial",
                is_active=True,
            ),
            Purpose(
                id="research_sharing",
                name="Research & Partner Sharing",
                description="Sharing de-identified, aggregated cardiovascular and endurance data with academic sports science partners.",
                category="research",
                is_active=True,
            ),
            Purpose(
                id="inactive_purpose",
                name="Archived Sleep Beta Study",
                description="Legacy sleep tracking pilot program that has been concluded and deactivated.",
                category="archived",
                is_active=False,
            ),
        ]
        db.add_all(purposes)
        db.commit()

    # 3. Seed Privacy Notice v1.0
    existing_notices = db.query(PrivacyNotice).count()
    if existing_notices == 0:
        version = "v1.0"
        title = "FitTrack Lite Master Privacy Notice"
        content = (
            "FitTrack Lite is committed to the highest standards of data protection under GDPR and the India DPDP Act 2023. "
            "We collect and process personal fitness telemetry strictly based on explicit, itemized, and withdrawable consent. "
            "Each purpose is individually controlled by you. Downstream APIs enforce live consent status at the instant of access. "
            "When you withdraw consent, data sharing ceases immediately. If this privacy notice changes materially, prior consents "
            "are treated as stale until you review and grant re-consent under the updated terms."
        )
        notice_hash = compute_notice_hash(version, title, content)
        notice = PrivacyNotice(
            version=version,
            title=title,
            content=content,
            hash_sha256=notice_hash,
            is_current=True,
            created_at=datetime.utcnow(),
        )
        db.add(notice)
        db.commit()

        # Audit the system genesis / notice initialization
        AuditService.log_event(
            db=db,
            event_type="SYSTEM_INIT",
            decision="RECORDED",
            reason_code="GENESIS_NOTICE_SEEDED",
            details={
                "notice_version": version,
                "notice_hash": notice_hash,
                "message": "FitTrack Lite system initialized with genesis privacy notice v1.0",
            },
        )
