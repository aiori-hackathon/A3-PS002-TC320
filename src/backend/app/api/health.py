from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FitTrack Lite Consent Management System",
        "version": "1.0.0",
        "timestamp": "2026-10-20T00:00:00Z"
    }
