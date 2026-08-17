from fastapi import APIRouter, Depends, Query

from app.api.deps import get_analytics_service, get_current_user
from app.schemas.analytics import (
    ConsumptionAnalyticsResponse,
    TankTrendsResponse,
    WaterQualityTrendsResponse,
)
from app.schemas.common import StandardResponse
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Consumption & Quality Analytics"])


@router.get(
    "/consumption",
    response_model=StandardResponse[ConsumptionAnalyticsResponse],
)
async def get_consumption_analytics(
    timeframe: str = Query("daily", description="Timeframe: daily, weekly, monthly"),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
):
    """Retrieve historical water consumption metrics formatted for chart libraries."""
    analytics = await analytics_service.get_consumption_analytics(timeframe=timeframe)
    return StandardResponse(
        success=True,
        message="Consumption analytics retrieved successfully",
        data=analytics,
    )


@router.get(
    "/water-quality-trends",
    response_model=StandardResponse[WaterQualityTrendsResponse],
)
async def get_water_quality_trends(
    analytics_service: AnalyticsService = Depends(get_analytics_service),
):
    """Retrieve water quality trends (TDS, pH, Turbidity) over time."""
    trends = await analytics_service.get_water_quality_trends()
    return StandardResponse(
        success=True,
        message="Water quality trends retrieved successfully",
        data=trends,
    )


@router.get(
    "/tank-trends/{tank_id}",
    response_model=StandardResponse[TankTrendsResponse],
)
async def get_tank_trends(
    tank_id: int,
    analytics_service: AnalyticsService = Depends(get_analytics_service),
):
    """Retrieve historical water storage level % trends for a tank."""
    trends = await analytics_service.get_tank_trends(tank_id)
    return StandardResponse(
        success=True,
        message=f"Tank trends for tank {tank_id} retrieved successfully",
        data=trends,
    )
