from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_ai_service
from app.schemas.ai import (
    AIInsightsSummaryResponse,
    DemandForecastResponse,
    InferenceRequest,
    PredictionResponse,
)
from app.schemas.common import StandardResponse
from app.services.ai.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI & Predictive Analytics"])


@router.post(
    "/infer/{tank_id}",
    response_model=StandardResponse[PredictionResponse],
    status_code=status.HTTP_201_CREATED,
)
async def run_ai_inference(
    tank_id: int,
    request: InferenceRequest = InferenceRequest(),
    ai_service: AIService = Depends(get_ai_service),
):
    """Trigger ML inference models on recent rolling sensor window and persist prediction."""
    prediction = await ai_service.run_leak_inference(
        tank_id=tank_id, window_size=request.window_size
    )
    return StandardResponse(
        success=True,
        message=f"Inference generated successfully by {prediction.model_name}",
        data=prediction,
    )


@router.get(
    "/predictions/{tank_id}",
    response_model=StandardResponse[List[PredictionResponse]],
)
async def get_tank_predictions(
    tank_id: int,
    type: Optional[str] = Query(None, description="Filter by prediction type (leak_probability, etc.)"),
    limit: int = Query(20, ge=1, le=100),
    ai_service: AIService = Depends(get_ai_service),
):
    """Retrieve historical AI model predictions for a tank."""
    predictions = await ai_service.get_tank_predictions(
        tank_id=tank_id, prediction_type=type, limit=limit
    )
    return StandardResponse(
        success=True,
        message="Historical predictions retrieved successfully",
        data=predictions,
    )


@router.get(
    "/demand-forecast/{tank_id}",
    response_model=StandardResponse[DemandForecastResponse],
)
async def get_demand_forecast(
    tank_id: int,
    ai_service: AIService = Depends(get_ai_service),
):
    """Retrieve 24-hour predictive water consumption demand curve."""
    forecast = await ai_service.get_demand_forecast(tank_id=tank_id)
    return StandardResponse(
        success=True,
        message="24-hour demand forecast generated successfully",
        data=forecast,
    )


@router.get(
    "/insights/{tank_id}",
    response_model=StandardResponse[AIInsightsSummaryResponse],
)
async def get_ai_insights_summary(
    tank_id: int,
    ai_service: AIService = Depends(get_ai_service),
):
    """Retrieve holistic AI health and operational insights."""
    summary = await ai_service.get_ai_insights_summary(tank_id=tank_id)
    return StandardResponse(
        success=True,
        message="AI insights summary retrieved successfully",
        data=summary,
    )
