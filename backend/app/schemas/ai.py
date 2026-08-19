from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class PredictionResponse(BaseModel):
    id: int
    tank_id: int
    model_name: str
    prediction_type: str  # leak_probability, demand_forecast, pump_failure
    predicted_value: float
    confidence: float
    features_snapshot: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class InferenceRequest(BaseModel):
    model_type: Optional[str] = Field("all", description="Model to run: leak, demand, pump, or all")
    window_size: int = Field(30, ge=5, le=500, description="Historical sensor readings sample window")


class DemandForecastDataPoint(BaseModel):
    hour_offset: int
    timestamp: str
    projected_consumption_liters: float
    confidence_lower: float
    confidence_upper: float


class DemandForecastResponse(BaseModel):
    tank_id: int
    horizon_hours: int
    total_projected_liters: float
    forecast_points: List[DemandForecastDataPoint]
    generated_at: datetime


class AIInsightsSummaryResponse(BaseModel):
    tank_id: int
    leak_probability: float
    leak_status: str  # Normal, Suspected, Confirmed
    predicted_daily_demand_liters: float
    pump_health_score: int
    pump_estimated_rul_hours: int
    anomaly_detected: bool
    latest_prediction_at: datetime
