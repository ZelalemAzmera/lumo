from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class LLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        prompt: str,
        context: List[str],
        system_prompt: Optional[str] = None
    ) -> str:
        """Generate a source-grounded response text."""
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if AI provider is reachable."""
        pass
