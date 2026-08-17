import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.logging import logger


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """Middleware for tracking request execution time and logging incoming HTTP requests."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        process_time_ms = (time.time() - start_time) * 1000
        response.headers["X-Process-Time"] = f"{process_time_ms:.2f}ms"
        
        logger.info(
            f"{request.method} {request.url.path} | Status: {response.status_code} | Duration: {process_time_ms:.2f}ms"
        )
        
        return response
