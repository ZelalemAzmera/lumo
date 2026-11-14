from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class FlaggedItem(BaseModel):
    type: str
    message: str
    context: Optional[str] = None

class DocumentProcessResponse(BaseModel):
    document_id: str
    status: str
    accessible_html_url: Optional[str] = None
    flags: List[FlaggedItem] = []
    metrics: Dict[str, Any] = {}
    created_at: datetime
