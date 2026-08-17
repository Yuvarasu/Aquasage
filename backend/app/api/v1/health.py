from fastapi import APIRouter, Depends
from app.api.deps import get_health_service
from app.schemas.health import HealthResponse
from app.services.health import HealthService

router = APIRouter(tags=["Health & Status"])


@router.get("/health", response_model=HealthResponse)
async def get_health(
    health_service: HealthService = Depends(get_health_service),
):
    """GET /api/v1/health - Check PostgreSQL database and Redis connectivity."""
    return await health_service.check_health()
