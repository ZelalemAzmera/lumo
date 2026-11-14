from pydantic import BaseModel
from typing import List, Optional

class Citation(BaseModel):
    timestamp_start: str
    timestamp_end: str
    excerpt: str

class AskQuestionRequest(BaseModel):
    question: str
    language: str = "en"
    session_id: Optional[str] = None
    transcript_text: Optional[str] = None

class AskQuestionResponse(BaseModel):
    answer: str
    citations: List[Citation] = []
    confidence_score: float = 0.95
    source: str = "transcript_grounded"

class LessonMetadataResponse(BaseModel):
    lesson_id: str
    title: str
    description: str
    duration_seconds: int
    languages_supported: List[str]
    has_audio_description: bool
    has_sign_language: bool
    transcript_summary: str
    video_url: str

