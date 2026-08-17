import sys
import time
import psutil
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.database.redis import get_redis_client
from app.schemas.health import HealthResponse, SystemStatusResponse

start_time = time.time()


class HealthService:
    """Service performing health diagnostics and metrics aggregation."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_health(self) -> HealthResponse:
        """Check status of Database and Redis connections."""
        # 1. Check DB
        db_status = "disconnected"
        try:
            result = await self.db.execute(text("SELECT 1"))
            if result.scalar() == 1:
                db_status = "connected"
        except Exception:
            db_status = "error"

        # 2. Check Redis
        redis_status = "disconnected"
        try:
            redis_client = await get_redis_client()
            if redis_client and await redis_client.ping():
                redis_status = "connected"
        except Exception:
            redis_status = "error"

        overall = "healthy" if db_status == "connected" and redis_status in ["connected", "disconnected"] else "degraded"

        return HealthResponse(
            status=overall,
            database=db_status,
            redis=redis_status,
        )

    async def get_system_status(self) -> SystemStatusResponse:
        """Retrieve system performance, memory usage, and runtime metrics."""
        process = psutil.Process()
        memory_info = process.memory_info()

        return SystemStatusResponse(
            environment=settings.ENVIRONMENT,
            app_version=settings.VERSION,
            uptime_seconds=round(time.time() - start_time, 2),
            cpu_percent=psutil.cpu_percent(interval=0.1),
            memory_usage_mb=round(memory_info.rss / (1024 * 1024), 2),
            python_version=sys.version.split(" ")[0],
            status="operational",
        )
