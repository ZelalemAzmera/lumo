from fastapi import Header, HTTPException, status
from app.core.config import settings

async def verify_api_key(x_lumo_key: str = Header(None, alias="X-Lumo-Key")):
    """Verify tenant API key from request headers"""
    if not x_lumo_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "MISSING_API_KEY",
                "message": "Missing 'X-Lumo-Key' authentication header"
            }
        )
    
    # Accept development key or tenant key
    if x_lumo_key != settings.DEFAULT_API_KEY and not x_lumo_key.startswith("lumo_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_API_KEY",
                "message": "The provided API key is invalid or expired"
            }
        )
    return x_lumo_key
