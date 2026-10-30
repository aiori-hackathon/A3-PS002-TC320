from datetime import datetime
from typing import Any, Dict
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services.audit_service import AuditService
from app.services.authorization_service import AuthorizationService


class DataService:
    @staticmethod
    def _generate_synthetic_data(user_id: str, purpose: str) -> Dict[str, Any]:
        """Generates purpose-specific synthetic fitness data."""
        now = datetime.utcnow().isoformat() + "Z"

        if purpose == "fitness_analytics":
            return {
                "user_id": user_id,
                "purpose": purpose,
                "timestamp": now,
                "metrics": {
                    "daily_steps": 9482,
                    "calories_burned_kcal": 612,
                    "active_minutes": 52,
                    "average_heart_rate_bpm": 68,
                    "resting_heart_rate_bpm": 58,
                    "distance_km": 7.34,
                    "floors_climbed": 14,
                },
                "data_classification": "synthetic_telemetry",
            }

        elif purpose == "personalized_recommendations":
            return {
                "user_id": user_id,
                "purpose": purpose,
                "timestamp": now,
                "recommendations": {
                    "suggested_workout": "45-min Zone 2 Aerobic Base Training",
                    "recovery_score_pct": 86,
                    "hydration_target_ml": 2800,
                    "sleep_recommendation_hours": 8.0,
                    "nutrition_focus": "Post-workout complex carbs and lean protein",
                },
                "data_classification": "synthetic_recommendations",
            }

        elif purpose == "marketing":
            return {
                "user_id": user_id,
                "purpose": purpose,
                "timestamp": now,
                "marketing_profile": {
                    "preferred_workout_time": "morning",
                    "interest_tags": ["trail_running", "smart_hydration", "marathon_prep"],
                    "eligible_promotions": [
                        {"id": "PROMO_FALL20", "discount": "20% off FitTrack Pro Smart Sensor"},
                        {"id": "EVENT_VIP", "invitation": "Global 10K Virtual Challenge"},
                    ],
                },
                "data_classification": "synthetic_marketing_segment",
            }

        elif purpose == "research_sharing":
            return {
                "user_id": f"anonymized_{hash(user_id) % 100000:05d}",
                "purpose": purpose,
                "timestamp": now,
                "research_packet": {
                    "cohort_id": "COHORT_ENDURANCE_BETA",
                    "vo2_max_estimate_ml_kg_min": 51.4,
                    "heart_rate_variability_ms": 64,
                    "sleep_efficiency_pct": 91.2,
                    "de_identified": True,
                },
                "data_classification": "synthetic_research_export",
            }

        else:
            return {
                "user_id": user_id,
                "purpose": purpose,
                "timestamp": now,
                "raw_activity": {"generic_log": "Standard activity packet"},
            }

    @staticmethod
    def process_data_access(db: Session, user_id: str, purpose: str) -> Dict[str, Any]:
        """
        Evaluates server-side authorization, logs every access attempt to the audit trail,
        and returns synthetic fitness data if allowed, or raises HTTP 403 on denial.
        """
        auth_result = AuthorizationService.evaluate_access(db, user_id, purpose)

        # Audit log the decision regardless of outcome
        AuditService.log_event(
            db=db,
            event_type="DATA_ACCESS",
            decision="ALLOW" if auth_result.is_authorized else "DENY",
            reason_code=auth_result.reason_code,
            user_id=user_id,
            purpose_id=purpose,
            details={
                "message": auth_result.message,
                "is_authorized": auth_result.is_authorized,
            },
        )

        if not auth_result.is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "status": "DENIED",
                    "reason_code": auth_result.reason_code,
                    "message": auth_result.message,
                    "user_id": user_id,
                    "purpose": purpose,
                },
            )

        # Authorized: return data
        synthetic_payload = DataService._generate_synthetic_data(user_id, purpose)
        return {
            "status": "ALLOWED",
            "reason_code": auth_result.reason_code,
            "user_id": user_id,
            "purpose": purpose,
            "timestamp": datetime.utcnow(),
            "data": synthetic_payload,
        }
