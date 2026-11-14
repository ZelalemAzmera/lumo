from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PackageGenerateRequest(BaseModel):
    lesson_id: str
    title: str
    video_url: str
    captions_en_url: Optional[str] = None
    captions_am_url: Optional[str] = None

class PackageJobResponse(BaseModel):
    package_id: str
    lesson_id: str
    status: str
    download_url: str
    size_bytes: int
    created_at: datetime
