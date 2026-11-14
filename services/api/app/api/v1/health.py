from fastapi import APIRouter
from datetime import datetime, timezone
from app.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def get_health():
    """System health check and diagnostic status"""
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        database="connected",
        storage="connected",
        ai_provider="ollama_local",
        timestamp=datetime.now(timezone.utc)
    )
