from typing import List, Dict, Any
from pydantic import BaseModel


class ConsumptionDataPoint(BaseModel):
    date: str
    consumption_liters: float
    avg_flow_lmin: float


class WaterQualityDataPoint(BaseModel):
    timestamp: str
    tds_ppm: float
    ph_level: float
    turbidity_ntu: float
    quality_score: float


class TankTrendDataPoint(BaseModel):
    timestamp: str
    water_level_pct: float
    volume_liters: float


class ConsumptionAnalyticsResponse(BaseModel):
    timeframe: str  # daily, weekly, monthly
    total_consumption_liters: float
    average_daily_liters: float
    peak_flow_lmin: float
    data: List[ConsumptionDataPoint]


class WaterQualityTrendsResponse(BaseModel):
    safe_days_pct: float
    average_tds_ppm: float
    average_ph: float
    data: List[WaterQualityDataPoint]


class TankTrendsResponse(BaseModel):
    tank_id: int
    data: List[TankTrendDataPoint]
