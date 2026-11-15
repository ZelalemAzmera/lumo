import secrets
import hashlib
from fastapi import Header, HTTPException, status
from app.core.config import settings

def hash_key(key: str) -> str:
    """Compute SHA-256 hash of API key for storage/lookup"""
    return hashlib.sha256(key.encode("utf-8")).hexdigest()

async def verify_api_key(x_lumo_key: str = Header(None, alias="X-Lumo-Key")):
    """
    Verify tenant API key from request headers.
    Uses constant-time comparison against provisioned keys to prevent timing attacks.
    Rejects unauthorized, expired, or arbitrary prefix-matched keys.
    """
    if not x_lumo_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "MISSING_API_KEY",
                "message": "Missing 'X-Lumo-Key' authentication header"
            }
        )
    
    # Constant-time comparison against explicitly provisioned tenant keys
    is_valid = any(
        secrets.compare_digest(x_lumo_key, valid_key)
        for valid_key in settings.PROVISIONED_API_KEYS
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_API_KEY",
                "message": "The provided API key is invalid, unauthorized, or expired"
            }
        )
        
    return x_lumo_key
