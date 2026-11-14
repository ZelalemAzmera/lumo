from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

class CaptionGenerateRequest(BaseModel):
    media_url: str
    language: str = "en"
    target_languages: List[str] = ["en", "am"]
    callback_url: Optional[str] = None

class CaptionJobResponse(BaseModel):
    job_id: str
    status: str
    estimated_duration_seconds: int
    created_at: datetime
