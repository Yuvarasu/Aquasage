from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_v1_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import logger
from app.database.session import engine
from app.database.base import Base
from app.database.redis import close_redis_connection, get_redis_client
from app.middleware.logging import RequestLoggerMiddleware
from app.middleware.rate_limit import RateLimitMiddleware

# Include models in metadata registration
import app.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")

    # Initialize Database Tables (for dev/sqlite fallback)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database schema: {e}")

    # Initialize Redis Connection conditionally
    if settings.ENABLE_REDIS:
        await get_redis_client()

    yield

    # Cleanup on shutdown
    logger.info("Shutting down application...")
    if settings.ENABLE_REDIS:
        await close_redis_connection()
    await engine.dispose()
    logger.info("Application shutdown complete.")


def create_application() -> FastAPI:
    """FastAPI Application Factory."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=(
            "Enterprise backend API for AI-Powered Rural Water Infrastructure Monitoring "
            "& Digital Twin Platform. Supports ESP32 sensor telemetry, real-time analytics, "
            "water quality monitoring, and leak detection."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # 1. CORS Middleware
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # 2. Custom Middlewares
    app.add_middleware(RequestLoggerMiddleware)
    app.add_middleware(RateLimitMiddleware, requests_per_minute=120)

    # 3. Global Exception Handlers
    register_exception_handlers(app)

    # 4. Include V1 Router, Root WebSocket Router & Aliases
    from app.api.v1 import health, sensor_data, websocket

    @app.get("/")
    async def root():
        return {
            "status": "online",
            "project": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs": "/docs",
            "endpoints": {
                "telemetry_ingest": f"{settings.API_V1_STR}/sensor-data",
                "health": f"{settings.API_V1_STR}/health",
                "latest_telemetry": f"{settings.API_V1_STR}/sensor-data/latest",
            },
        }

    # Mount convenient aliases at root level (e.g. /sensor-data and /health)
    app.include_router(sensor_data.router)
    app.include_router(health.router)

    # Mount WebSocket and API V1
    app.include_router(websocket.router)
    app.include_router(api_v1_router, prefix=settings.API_V1_STR)

    return app


app = create_application()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
