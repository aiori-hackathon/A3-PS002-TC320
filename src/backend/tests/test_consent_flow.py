import json
import pytest
from app.core.config import settings
from app.models.audit_event import AuditEvent
from app.models.consent_event import ConsentEvent


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_seed_data_loaded(client):
    users_resp = client.get("/api/users")
    assert users_resp.status_code == 200
    users = users_resp.json()
    assert len(users) >= 5

    purposes_resp = client.get("/api/purposes")
    assert purposes_resp.status_code == 200
    purposes = purposes_resp.json()
    assert len(purposes) >= 4

    notice_resp = client.get("/api/notices/current")
    assert notice_resp.status_code == 200
    notice = notice_resp.json()
    assert notice["version"] == "v1.0"
    assert len(notice["hash_sha256"]) == 64


def test_missing_consent_denies_access(client):
    """Missing consent denies access with HTTP 403 and NO_CONSENT reason code."""
    response = client.post(
        "/api/data/access",
        json={"user_id": "user_001", "purpose": "fitness_analytics"},
    )
    assert response.status_code == 403
    data = response.json()["detail"]
    assert data["status"] == "DENIED"
    assert data["reason_code"] == "NO_CONSENT"
    assert "data" not in response.json()


def test_matching_active_consent_allows_access(client):
    """Granting consent creates an event and subsequently allows access with HTTP 200."""
    grant_resp = client.post(
        "/api/consent/grant",
        json={"user_id": "user_001", "purpose_id": "fitness_analytics"},
    )
    assert grant_resp.status_code == 201

    access_resp = client.post(
        "/api/data/access",
        json={"user_id": "user_001", "purpose": "fitness_analytics"},
    )
    assert access_resp.status_code == 200
    res_data = access_resp.json()
    assert res_data["status"] == "ALLOWED"
    assert res_data["reason_code"] == "CONSENT_ACTIVE"
    assert "metrics" in res_data["data"]


def test_withdrawal_blocks_next_request(client):
    """
    Essential workflow: Grant -> HTTP 200 -> Withdraw -> HTTP 403 (CONSENT_WITHDRAWN).
    """
    # 1. Grant
    client.post(
        "/api/consent/grant",
        json={"user_id": "user_001", "purpose_id": "fitness_analytics"},
    )
    access_1 = client.post(
        "/api/data/access",
        json={"user_id": "user_001", "purpose": "fitness_analytics"},
    )
    assert access_1.status_code == 200

    # 2. Withdraw
    withdraw_resp = client.post(
        "/api/consent/withdraw",
        json={"user_id": "user_001", "purpose_id": "fitness_analytics"},
    )
    assert withdraw_resp.status_code == 201

    # 3. Next request is blocked
    access_2 = client.post(
        "/api/data/access",
        json={"user_id": "user_001", "purpose": "fitness_analytics"},
    )
    assert access_2.status_code == 403
    data = access_2.json()["detail"]
    assert data["status"] == "DENIED"
    assert data["reason_code"] == "CONSENT_WITHDRAWN"
    assert "data" not in access_2.json()


def test_purpose_mismatch_denial(client):
    """Consent for Purpose A cannot be reused for Purpose B."""
    # Grant fitness_analytics
    client.post(
        "/api/consent/grant",
        json={"user_id": "user_001", "purpose_id": "fitness_analytics"},
    )

    # Request marketing without marketing consent
    access = client.post(
        "/api/data/access",
        json={"user_id": "user_001", "purpose": "marketing"},
    )
    assert access.status_code == 403
    assert access.json()["detail"]["reason_code"] == "NO_CONSENT"


def test_unknown_user_and_unknown_purpose_denial(client):
    """Unknown users and unknown purposes are rejected with 403."""
    # Unknown user
    resp_user = client.post(
        "/api/data/access",
        json={"user_id": "non_existent_user_999", "purpose": "fitness_analytics"},
    )
    assert resp_user.status_code == 403
    assert resp_user.json()["detail"]["reason_code"] == "UNKNOWN_USER"

    # Unknown purpose
    resp_purp = client.post(
        "/api/data/access",
        json={"user_id": "user_001", "purpose": "non_existent_purpose"},
    )
    assert resp_purp.status_code == 403
    assert resp_purp.json()["detail"]["reason_code"] == "UNKNOWN_PURPOSE"


def test_inactive_user_and_purpose_denial(client):
    """Inactive users and purposes are denied."""
    resp_user = client.post(
        "/api/data/access",
        json={"user_id": "user_inactive", "purpose": "fitness_analytics"},
    )
    assert resp_user.status_code == 403
    assert resp_user.json()["detail"]["reason_code"] == "INACTIVE_USER"

    resp_purp = client.post(
        "/api/data/access",
        json={"user_id": "user_001", "purpose": "inactive_purpose"},
    )
    assert resp_purp.status_code == 403
    assert resp_purp.json()["detail"]["reason_code"] == "INACTIVE_PURPOSE"


def test_notice_change_stale_consent_and_reconsent(client):
    """
    Publishing a new privacy notice invalidates older consent (CONSENT_STALE).
    Re-consenting under the new notice restores access.
    """
    # 1. Grant consent under v1.0
    client.post(
        "/api/consent/grant",
        json={"user_id": "user_001", "purpose_id": "fitness_analytics"},
    )
    access_v1 = client.post(
        "/api/data/access",
        json={"user_id": "user_001", "purpose": "fitness_analytics"},
    )
    assert access_v1.status_code == 200

    # 2. Administrator publishes notice v2.0
    new_notice = {
        "version": "v2.0",
        "title": "FitTrack Lite Updated Privacy Notice v2.0",
        "content": "Updated terms regarding advanced telemetry analytics and academic research partnerships.",
    }
    publish_resp = client.post(
        "/api/notices",
        json=new_notice,
        headers={"X-Admin-Key": settings.ADMIN_API_KEY},
    )
    assert publish_resp.status_code == 201

    # 3. Access is now denied with CONSENT_STALE
    access_stale = client.post(
        "/api/data/access",
        json={"user_id": "user_001", "purpose": "fitness_analytics"},
    )
    assert access_stale.status_code == 403
    assert access_stale.json()["detail"]["reason_code"] == "CONSENT_STALE"

    # 4. User re-consents under current notice v2.0
    reconsent_resp = client.post(
        "/api/consent/grant",
        json={"user_id": "user_001", "purpose_id": "fitness_analytics"},
    )
    assert reconsent_resp.status_code == 201
    assert reconsent_resp.json()["notice_version"] == "v2.0"

    # 5. Access is restored
    access_restored = client.post(
        "/api/data/access",
        json={"user_id": "user_001", "purpose": "fitness_analytics"},
    )
    assert access_restored.status_code == 200
    assert access_restored.json()["status"] == "ALLOWED"


def test_append_only_consent_history(client, db_session):
    """Verify that multiple grants and withdrawals never overwrite past records."""
    # Grant, withdraw, grant again
    client.post("/api/consent/grant", json={"user_id": "user_002", "purpose_id": "marketing"})
    client.post("/api/consent/withdraw", json={"user_id": "user_002", "purpose_id": "marketing"})
    client.post("/api/consent/grant", json={"user_id": "user_002", "purpose_id": "marketing"})

    # Check history endpoint
    history_resp = client.get("/api/consent/history?user_id=user_002")
    assert history_resp.status_code == 200
    events = history_resp.json()
    assert len(events) == 3
    # Actions should be preserved in reverse chronological order
    actions = [e["action"] for e in events]
    assert actions == ["GRANT", "WITHDRAW", "GRANT"]

    # Also directly verify DB records
    db_records = (
        db_session.query(ConsentEvent)
        .filter(ConsentEvent.user_id == "user_002")
        .order_by(ConsentEvent.id.asc())
        .all()
    )
    assert len(db_records) == 3
    assert [r.action for r in db_records] == ["GRANT", "WITHDRAW", "GRANT"]


def test_audit_logging_and_verification(client):
    """Audit events are logged for access attempts and valid chain passes verification."""
    # Perform actions
    client.post("/api/consent/grant", json={"user_id": "user_003", "purpose_id": "research_sharing"})
    client.post("/api/data/access", json={"user_id": "user_003", "purpose": "research_sharing"})
    client.post("/api/data/access", json={"user_id": "user_003", "purpose": "marketing"})  # denied

    verify_resp = client.get("/api/audit/verify")
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["is_valid"] is True
    assert verify_data["total_records"] >= 3
    assert verify_data["error_message"] is None


def test_audit_tamper_detection(client, db_session):
    """Tampering with an audit record causes verification to fail."""
    # Ensure there is an audit event
    client.post("/api/consent/grant", json={"user_id": "user_004", "purpose_id": "fitness_analytics"})

    # Tamper with the payload via admin endpoint
    tamper_resp = client.post(
        "/api/admin/tamper-test?tamper_type=payload",
        headers={"X-Admin-Key": settings.ADMIN_API_KEY},
    )
    assert tamper_resp.status_code == 200

    # Verification must detect the tampering
    verify_resp = client.get("/api/audit/verify")
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["is_valid"] is False
    assert verify_data["broken_at_sequence"] is not None
    assert "tampering detected" in verify_data["error_message"]


def test_audit_broken_hash_link_detection(client, db_session):
    """Corrupting a hash link causes verification to fail."""
    # Ensure records exist
    client.post("/api/consent/grant", json={"user_id": "user_005", "purpose_id": "fitness_analytics"})
    client.post("/api/data/access", json={"user_id": "user_005", "purpose": "fitness_analytics"})

    # Corrupt hash link
    tamper_resp = client.post(
        "/api/admin/tamper-test?tamper_type=hash_link",
        headers={"X-Admin-Key": settings.ADMIN_API_KEY},
    )
    assert tamper_resp.status_code == 200

    # Verification must fail
    verify_resp = client.get("/api/audit/verify")
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["is_valid"] is False
    assert verify_data["broken_at_sequence"] is not None


def test_audit_export_json_and_csv(client):
    """Audit export endpoints return valid JSON and CSV formats."""
    # JSON export
    json_resp = client.get("/api/audit/export?format=json")
    assert json_resp.status_code == 200
    assert json_resp.headers["content-type"].startswith("application/json")
    parsed_json = json.loads(json_resp.text)
    assert isinstance(parsed_json, list)

    # CSV export
    csv_resp = client.get("/api/audit/export?format=csv")
    assert csv_resp.status_code == 200
    assert csv_resp.headers["content-type"].startswith("text/csv")
    assert "sequence_number,event_id,timestamp" in csv_resp.text


def test_admin_authorization_enforced(client):
    """Admin endpoints require valid X-Admin-Key."""
    # Without header -> 422 or 401
    resp_no_auth = client.post(
        "/api/notices",
        json={"version": "v3.0", "title": "Unauthorized Notice", "content": "Test"},
    )
    assert resp_no_auth.status_code in [401, 422]

    # With wrong key -> 401
    resp_bad_auth = client.post(
        "/api/notices",
        json={"version": "v3.0", "title": "Unauthorized Notice", "content": "Test"},
        headers={"X-Admin-Key": "wrong_key"},
    )
    assert resp_bad_auth.status_code == 401
