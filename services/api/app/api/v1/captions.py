from fastapi import APIRouter, Depends, Response
from datetime import datetime, timezone
import uuid
from app.schemas.captions import CaptionGenerateRequest, CaptionJobResponse
from app.core.security import verify_api_key

router = APIRouter()

# In-memory store for demonstration
CAPTIONS_STORE = {
    "sample-lesson-en": "WEBVTT - Lumo Captions\n\n1\n00:00:00.500 --> 00:00:04.000\nWelcome to this accessible digital skills lesson.\n",
    "sample-lesson-am": "WEBVTT - Lumo Captions\nLanguage: am\n\n1\n00:00:00.500 --> 00:00:04.000 lang:am\n<lang am>እንኳን ወደዚህ የዲጂታል ክህሎት ትምህርት በደህና መጡ።</lang>\n"
}

@router.post("/captions/generate", response_model=CaptionJobResponse, status_code=202)
async def generate_captions(
    payload: CaptionGenerateRequest,
    api_key: str = Depends(verify_api_key)
):
    """Submit a video/audio media URL for automated caption generation"""
    job_id = f"cap_{uuid.uuid4().hex[:12]}"
    return CaptionJobResponse(
        job_id=job_id,
        status="QUEUED",
        estimated_duration_seconds=30,
        created_at=datetime.now(timezone.utc)
    )

@router.get("/captions/{caption_id}")
async def get_caption_track(caption_id: str):
    """Retrieve generated WebVTT caption file content"""
    content = CAPTIONS_STORE.get(caption_id)
    if not content:
        # Default VTT response for demo IDs
        content = f"WEBVTT - Lumo Caption Track: {caption_id}\n\n1\n00:00:01.000 --> 00:00:05.000\nSample synchronized lesson subtitle.\n"
    
    return Response(content=content, media_type="text/vtt")
