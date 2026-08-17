from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class SensorDataIngest(BaseModel):
    device_id: int = Field(..., description="Registered Device ID")
    tank_id: int = Field(..., description="Target Storage Tank ID")

    # HC-SR04 Metrics
    distance_cm: float = Field(..., ge=0, description="HC-SR04 Ultrasonic Distance Measurement in CM")
    water_level_pct: float = Field(..., ge=0, le=100, description="Calculated Water Level Percentage")

    # YF-S201 Flow Metrics
    flow_rate_lmin: float = Field(..., ge=0, description="Water Flow Rate in L/min")
    daily_consumption_liters: float = Field(0.0, ge=0, description="Daily Total Water Consumption")
    hourly_consumption_liters: float = Field(0.0, ge=0)

    # TDS & Quality Sensors
    tds_ppm: float = Field(..., ge=0, le=5000, description="TDS Sensor value in PPM (Safe < 500)")
    ph_level: float = Field(7.2, ge=0, le=14)
    turbidity_ntu: float = Field(0.4, ge=0)

    # Hydraulic Pressure
    pressure_bar: float = Field(3.8, ge=0)

    @field_validator("water_level_pct")
    @classmethod
    def validate_water_level(cls, v: float) -> float:
        if v < 0 or v > 100:
            raise ValueError("Water level percentage must be between 0% and 100%")
        return v

    @field_validator("flow_rate_lmin")
    @classmethod
    def validate_flow_rate(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Flow rate cannot be negative")
        return v

    @field_validator("tds_ppm")
    @classmethod
    def validate_tds(cls, v: float) -> float:
        if v < 0 or v > 5000:
            raise ValueError("Invalid TDS value. Must be between 0 and 5000 PPM.")
        return v


class SensorReadingResponse(BaseModel):
    id: int
    device_id: int
    tank_id: int
    distance_cm: float
    water_level_pct: float
    flow_rate_lmin: float
    daily_consumption_liters: float
    hourly_consumption_liters: float
    tds_ppm: float
    ph_level: float
    turbidity_ntu: float
    water_quality_status: str
    pressure_bar: float
    leak_probability: float
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class FrontendTelemetryPayload(BaseModel):
    """Payload directly feeding frontend useTelemetryStore Zustand state."""
    timestamp: str
    pressure: float
    flowRate: float
    tankLevel: float
    tankCapacityLiters: float
    pumpStatus: str
    pumpRPM: int
    dailyConsumptionLiters: float
    hourlyConsumptionLiters: float
    leakProbability: float
    pumpHealthScore: int
    valveStatus: str
    waterTurbidityNTU: float
    pHLevel: float
