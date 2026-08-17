from typing import Dict, Any, Optional
from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    status: str
    database: str
    redis: str

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "status": "healthy",
            "database": "connected",
            "redis": "connected",
        }
    })


class SystemStatusResponse(BaseModel):
    environment: str
    app_version: str
    uptime_seconds: float
    cpu_percent: float
    memory_usage_mb: float
    python_version: str
    status: str = "operational"
