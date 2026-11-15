import time
from collections import defaultdict
from fastapi import HTTPException, Request, status

# In-memory sliding window rate limiter: client_id -> list of timestamps
_request_history = defaultdict(list)

def rate_limit(max_requests: int = 60, window_seconds: int = 60):
    """
    Enforces per-client sliding window rate limiting.
    Identifies clients by X-Lumo-Key or client IP address.
    """
    async def dependency(request: Request):
        client_key = request.headers.get("X-Lumo-Key") or (
            request.client.host if request.client else "anonymous"
        )
        now = time.time()
        window_start = now - window_seconds

        # Clean old timestamps
        history = [ts for ts in _request_history[client_key] if ts > window_start]
        
        if len(history) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Rate limit of {max_requests} requests per {window_seconds}s exceeded. Please retry later.",
                    "retry_after_seconds": int(window_seconds - (now - history[0])) if history else window_seconds
                },
                headers={"Retry-After": str(window_seconds)}
            )

        history.append(now)
        _request_history[client_key] = history

    return dependency
