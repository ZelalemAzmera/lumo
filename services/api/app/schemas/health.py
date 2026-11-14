from pydantic import BaseModel
from datetime import datetime

class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    storage: str
    ai_provider: str
    timestamp: datetime
