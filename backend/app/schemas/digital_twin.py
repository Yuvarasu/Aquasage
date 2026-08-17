from typing import Dict, Any
from pydantic import BaseModel


class WaterQualityState(BaseModel):
    tds_ppm: float
    ph_level: float
    turbidity_ntu: float
    status: str  # Safe / Unsafe


class PumpState(BaseModel):
    status: str  # running, stopped, fault
    rpm: int
    health_score: int


class AIInsightsState(BaseModel):
    leak_probability: float
    pump_rul_hours: int
    friction_efficiency_pct: float


class DigitalTwinResponse(BaseModel):
    tank_id: int
    tank_name: str
    location: str
    current_level_pct: float
    current_volume_liters: float
    capacity_liters: float
    inflow_rate_lmin: float
    outflow_rate_lmin: float
    pressure_bar: float
    water_quality: WaterQualityState
    pump_state: PumpState
    ai_insights: AIInsightsState
    tank_status: str
