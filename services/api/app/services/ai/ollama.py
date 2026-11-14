import httpx
from typing import List, Optional
from app.services.ai.base import LLMProvider
from app.core.config import settings

class OllamaProvider(LLMProvider):
    def __init__(self, host: str = settings.OLLAMA_HOST, model: str = settings.OLLAMA_MODEL):
        self.host = host.rstrip("/")
        self.model = model

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                res = await client.get(f"{self.host}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    async def generate_response(
        self,
        prompt: str,
        context: List[str],
        system_prompt: Optional[str] = None
    ) -> str:
        sys_msg = system_prompt or (
            "You are the Lumo Accessible Lesson Tutor. Answer ONLY using the provided transcript excerpts. "
            "If the answer cannot be found, say: 'I cannot find that in the lesson material.'"
        )

        context_block = "\n---\n".join(context) if context else "No extra context provided."
        full_prompt = f"Transcript Context:\n{context_block}\n\nQuestion: {prompt}\nAnswer:"

        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "system": sys_msg,
            "stream": False
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(f"{self.host}/api/generate", json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("response", "").strip()
        except Exception:
            pass

        # Grounded fallback if Ollama instance is not running
        return f"Based on the course transcript: {context[0] if context else 'Lesson content available in player.'}"
