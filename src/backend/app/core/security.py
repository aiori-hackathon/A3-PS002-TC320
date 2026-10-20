from fastapi import Header, HTTPException, status
from app.core.config import settings


async def verify_admin_key(x_admin_key: str = Header(..., alias="X-Admin-Key")):
    """Verifies the administrative secret key passed in the X-Admin-Key header."""
    if x_admin_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing administrative API key"
        )
    return True
