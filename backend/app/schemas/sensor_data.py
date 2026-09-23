from datetime import datetime, timezone
from typing import Any, Dict, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# ============================================================================
# Section 11: Nested Hardware Telemetry Models (ESP32 DevKit V1 / Node-RED)
# ============================================================================

class TankTelemetryData(BaseModel):
    distance_cm: float = Field(..., ge=0.0, description="Measured distance from sensor to water surface in CM")
    water_level_percent: float = Field(..., ge=0.0, le=100.0, description="Calculated tank water level percentage")


class FlowTelemetryData(BaseModel):
    flow_1_lpm: float = Field(0.0, ge=0.0, description="Upstream / Inlet Flow sensor 1 in L/min")
    flow_2_lpm: float = Field(0.0, ge=0.0, description="Downstream / Outlet Flow sensor 2 in L/min")
    flow_1_total_liters: float = Field(0.0, ge=0.0, description="Accumulated liters through Flow Sensor 1")
    flow_2_total_liters: float = Field(0.0, ge=0.0, description="Accumulated liters through Flow Sensor 2")


class WaterQualityTelemetryData(BaseModel):
    tds_ppm: float = Field(0.0, ge=0.0, le=5000.0, description="Total Dissolved Solids in PPM")
    turbidity_raw: int = Field(1000, ge=0, description="Raw ADC Turbidity sensor value")


class PumpTelemetryData(BaseModel):
    status: bool = Field(False, description="Water pump relay status (True = ON, False = OFF)")


class DeviceTelemetryData(BaseModel):
    wifi_rssi: int = Field(-55, description="Wi-Fi Signal strength in dBm")
    firmware_version: str = Field("0.1.0", description="Controller firmware version")


class ESP32TelemetryPayload(BaseModel):
    """Section 11 Hardware Telemetry Format from ESP32 / Node-RED simulator."""
    device_id: str = Field(..., description="Unique Hardware Device Identifier (e.g. ESP32_TANK_01)")
    timestamp: Optional[Union[datetime, str]] = Field(None, description="Telemetry timestamp (ISO-8601 UTC)")
    tank: TankTelemetryData
    flow: FlowTelemetryData = Field(default_factory=FlowTelemetryData)
    water_quality: WaterQualityTelemetryData = Field(default_factory=WaterQualityTelemetryData)
    pump: PumpTelemetryData = Field(default_factory=PumpTelemetryData)
    device: DeviceTelemetryData = Field(default_factory=DeviceTelemetryData)


# ============================================================================
# Universal Sensor Ingestion Schema (Accepts nested ESP32 and flat JSON)
# ============================================================================

class SensorDataIngest(BaseModel):
    """Unified Ingestion Schema supporting Section 11 nested payload & flat payloads."""
    device_id: Union[str, int] = Field(..., description="Device identifier (e.g., 'ESP32_TANK_01' or 1)")
    tank_id: Optional[int] = Field(None, description="Target storage tank ID (defaults to assigned tank)")

    # HC-SR04 Tank Level
    distance_cm: float = Field(..., ge=0.0, description="Distance in CM")
    water_level_pct: float = Field(..., ge=0.0, le=100.0, description="Water level percentage")

    # Dual Flow Sensors
    flow_1_lpm: float = Field(0.0, ge=0.0, description="Inlet Flow Sensor 1 (L/min)")
    flow_2_lpm: float = Field(0.0, ge=0.0, description="Outlet Flow Sensor 2 (L/min)")
    flow_1_total_liters: float = Field(0.0, ge=0.0)
    flow_2_total_liters: float = Field(0.0, ge=0.0)

    # Water Quality
    tds_ppm: float = Field(0.0, ge=0.0, le=5000.0, description="TDS in PPM")
    turbidity_raw: int = Field(1000, ge=0, description="Raw ADC turbidity")

    # Pump & Device
    pump_status: bool = Field(False, description="Pump relay state (True=ON, False=OFF)")
    wifi_rssi: int = Field(-55, description="WiFi RSSI dBm")
    firmware_version: str = Field("0.1.0")
    timestamp: Optional[Union[datetime, str]] = None

    # Backward compatibility aliases
    flow_rate_lmin: Optional[float] = None
    daily_consumption_liters: Optional[float] = None
    hourly_consumption_liters: Optional[float] = None
    ph_level: Optional[float] = None
    turbidity_ntu: Optional[float] = None
    pressure_bar: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def parse_nested_esp32_payload(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        # Check if incoming payload is in Section 11 nested format
        if "tank" in data and isinstance(data["tank"], dict):
            tank_data = data["tank"]
            flow_data = data.get("flow", {}) if isinstance(data.get("flow"), dict) else {}
            wq_data = data.get("water_quality", {}) if isinstance(data.get("water_quality"), dict) else {}
            pump_data = data.get("pump", {}) if isinstance(data.get("pump"), dict) else {}
            dev_data = data.get("device", {}) if isinstance(data.get("device"), dict) else {}

            flat_data: Dict[str, Any] = {
                "device_id": str(data.get("device_id", "ESP32_TANK_01")),
                "tank_id": data.get("tank_id"),
                "distance_cm": tank_data.get("distance_cm", 0.0),
                "water_level_pct": tank_data.get("water_level_percent", tank_data.get("water_level_pct", 0.0)),
                "flow_1_lpm": flow_data.get("flow_1_lpm", flow_data.get("flow_rate_lmin", 0.0)),
                "flow_2_lpm": flow_data.get("flow_2_lpm", 0.0),
                "flow_1_total_liters": flow_data.get("flow_1_total_liters", 0.0),
                "flow_2_total_liters": flow_data.get("flow_2_total_liters", 0.0),
                "tds_ppm": wq_data.get("tds_ppm", 0.0),
                "turbidity_raw": wq_data.get("turbidity_raw", 1000),
                "pump_status": bool(pump_data.get("status", False)),
                "wifi_rssi": dev_data.get("wifi_rssi", -55),
                "firmware_version": dev_data.get("firmware_version", "0.1.0"),
                "timestamp": data.get("timestamp"),
            }
            return flat_data

        # If flat payload, harmonize all common field aliases from ESP32 nodes
        if "node_id" in data and "device_id" not in data:
            data["device_id"] = str(data["node_id"])
        if "device_id" not in data or not data["device_id"]:
            data["device_id"] = "ESP32_TANK_01"

        if "waterPercentage" in data and "water_level_pct" not in data:
            data["water_level_pct"] = data["waterPercentage"]
        elif "water_percentage" in data and "water_level_pct" not in data:
            data["water_level_pct"] = data["water_percentage"]
        elif "water_level_percent" in data and "water_level_pct" not in data:
            data["water_level_pct"] = data["water_level_percent"]
        elif "water_level" in data and "water_level_pct" not in data:
            data["water_level_pct"] = data["water_level"]
        elif "waterLevel" in data and "water_level_pct" not in data:
            data["water_level_pct"] = data["waterLevel"]
        elif "level" in data and "water_level_pct" not in data:
            data["water_level_pct"] = data["level"]

        if "distance" in data and "distance_cm" not in data:
            data["distance_cm"] = data["distance"]

        # If one is present and the other missing, derive based on 25cm calibrated tank
        if "distance_cm" in data and "water_level_pct" not in data:
            try:
                dist = float(data["distance_cm"])
                data["water_level_pct"] = round(max(0.0, min(100.0, ((25.0 - dist) / 25.0) * 100.0)), 1)
            except (ValueError, TypeError):
                data["water_level_pct"] = 0.0
        elif "water_level_pct" in data and "distance_cm" not in data:
            try:
                pct = float(data["water_level_pct"])
                data["distance_cm"] = round(max(0.0, 25.0 * (1.0 - (pct / 100.0))), 1)
            except (ValueError, TypeError):
                data["distance_cm"] = 25.0
        elif "distance_cm" not in data and "water_level_pct" not in data:
            data["distance_cm"] = 25.0
            data["water_level_pct"] = 0.0

        if "flow_rate_lmin" in data and "flow_1_lpm" not in data:
            data["flow_1_lpm"] = data["flow_rate_lmin"]
        if "flow_1_lpm" in data and "flow_rate_lmin" not in data:
            data["flow_rate_lmin"] = data["flow_1_lpm"]
        if "flow1" in data and "flow_1_lpm" not in data:
            data["flow_1_lpm"] = data["flow1"]
        if "flow2" in data and "flow_2_lpm" not in data:
            data["flow_2_lpm"] = data["flow2"]
        if "tds" in data and "tds_ppm" not in data:
            data["tds_ppm"] = data["tds"]
        if "turbidity" in data and "turbidity_raw" not in data:
            data["turbidity_raw"] = int(data["turbidity"])

        return data


# ============================================================================
# Response Schemas
# ============================================================================

class SensorReadingResponse(BaseModel):
    """Historical Sensor Reading Response."""
    id: int
    device_id: str
    tank_id: int
    distance_cm: float
    water_level_pct: float
    flow_1_lpm: float
    flow_2_lpm: float
    flow_1_total_liters: float
    flow_2_total_liters: float
    flow_difference_lpm: float
    estimated_water_loss_lpm: float
    possible_leak: bool
    leak_probability: float
    tds_ppm: float
    turbidity_raw: int
    turbidity_status: str
    water_quality_status: str
    pump_status: bool
    wifi_rssi: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class FrontendTelemetryPayload(BaseModel):
    """Payload directly feeding frontend useTelemetryStore Zustand state."""
    timestamp: str
    pressure: float = 3.8
    flowRate: float
    tankLevel: float
    tankCapacityLiters: float
    pumpStatus: str  # 'running' | 'stopped' | 'fault'
    pumpRPM: int
    dailyConsumptionLiters: float
    hourlyConsumptionLiters: float
    leakProbability: float
    pumpHealthScore: int = 94
    valveStatus: str = "OPEN"
    waterTurbidityNTU: float = 0.4
    pHLevel: float = 7.2
    # Additional physical telemetry
    flow_1_lpm: Optional[float] = None
    flow_2_lpm: Optional[float] = None
    water_loss_lpm: Optional[float] = None
    tds_ppm: Optional[float] = None
    tdsLevel: Optional[float] = None
    turbidity_raw: Optional[int] = None
    turbidity_status: Optional[str] = None
    water_quality_status: Optional[str] = None
    distance_cm: Optional[float] = None
    water_height_cm: Optional[float] = None
