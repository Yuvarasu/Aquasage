from fastapi import APIRouter, Depends
from app.api.deps import get_health_service
from app.schemas.common import StandardResponse
from app.schemas.health import SystemStatusResponse
from app.services.health import HealthService

router = APIRouter(prefix="/system", tags=["Health & Status"])


@router.get("/status", response_model=StandardResponse[SystemStatusResponse])
async def get_system_status(
    health_service: HealthService = Depends(get_health_service),
):
    """GET /api/v1/system/status - Retrieve system metrics, uptime, CPU, and memory details."""
    status_data = await health_service.get_system_status()
    return StandardResponse(
        success=True,
        message="System status retrieved successfully",
        data=status_data,
    )
