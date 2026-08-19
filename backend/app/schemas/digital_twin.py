from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class WaterQualityState(BaseModel):
    tds_ppm: float
    ph_level: float = 7.2
    turbidity_ntu: float = 0.4
    turbidity_raw: int = 1000
    turbidity_status: str = "Clear"
    status: str = "Good"  # Good, Monitor, High / Safe, Unsafe


class PumpState(BaseModel):
    status: str  # ON, OFF / running, stopped, fault
    rpm: int = 0
    health_score: int = 94


class AIInsightsState(BaseModel):
    leak_probability: float = 0.0
    possible_leak: bool = False
    pump_rul_hours: int = 2400
    friction_efficiency_pct: float = 98.5


# ============================================================================
# Section 14: Digital Twin State Response Contract
# ============================================================================

class DigitalTwinStateResponse(BaseModel):
    """Section 14 Digital Twin State Response representing current operational state."""
    tank_id: int
    tank_name: str
    location: str
    tank_level_percent: float
    distance_cm: float
    capacity_liters: float
    current_volume_liters: float
    flow_in: float  # flow_1_lpm
    flow_out: float  # flow_2_lpm
    water_loss: float  # flow_1 - flow_2
    flow_1_total_liters: float = 0.0
    flow_2_total_liters: float = 0.0
    tds: float
    turbidity: str  # Clear, Moderate, High
    turbidity_raw: int
    water_quality_status: str  # Good, Monitor, High
    pump: str  # ON / OFF
    system_status: str  # Optimal, Warning, Critical
    leak_probability: float
    possible_leak: bool
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)


class DigitalTwinResponse(BaseModel):
    """Extended Composite Digital Twin Response."""
    tank_id: int
    tank_name: str
    location: str
    current_level_pct: float
    current_volume_liters: float
    capacity_liters: float
    inflow_rate_lmin: float
    outflow_rate_lmin: float
    pressure_bar: float = 3.8
    water_quality: WaterQualityState
    pump_state: PumpState
    ai_insights: AIInsightsState
    tank_status: str
    digital_twin: Optional[DigitalTwinStateResponse] = None

    model_config = ConfigDict(from_attributes=True)
