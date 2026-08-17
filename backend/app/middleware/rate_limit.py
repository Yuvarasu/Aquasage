import time
from typing import Dict, Tuple
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """In-memory sliding window rate limiting middleware foundation."""

    def __init__(self, app, requests_per_minute: int = 120):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        # IP -> list of timestamps
        self.clients: Dict[str, list] = {}

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Skip rate limiting for static/health routes if desired
        if request.url.path in ["/api/v1/health", "/docs", "/openapi.json"]:
            return await call_next(request)

        # Cleanup old timestamps > 60 seconds
        timestamps = [t for t in self.clients.get(client_ip, []) if now - t < 60]

        if len(timestamps) >= self.requests_per_minute:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "message": "Rate limit exceeded. Please try again later.",
                },
            )

        timestamps.append(now)
        self.clients[client_ip] = timestamps

        return await call_next(request)
