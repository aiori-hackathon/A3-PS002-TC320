from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.data_access import DataAccessRequest, DataAccessResponse
from app.services.data_service import DataService

router = APIRouter(prefix="/data", tags=["Data Sharing Simulation"])


@router.post("/access", response_model=DataAccessResponse)
def access_protected_data(
    payload: DataAccessRequest,
    db: Session = Depends(get_db),
):
    """
    Downstream Mock Data Access Endpoint.
    Validates live informed consent server-side.
    Returns HTTP 200 with synthetic fitness data if authorized.
    Returns HTTP 403 with a specific reason code if denied.
    Logs every attempt to the audit hash chain.
    """
    return DataService.process_data_access(
        db=db,
        user_id=payload.user_id,
        purpose=payload.purpose,
    )
