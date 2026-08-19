import pytest
from datetime import datetime, timezone
from pydantic import ValidationError

from app.schemas.alert import AlertCreate, AlertResponse
from app.schemas.device import DeviceRegister, DeviceResponse
from app.schemas.digital_twin import DigitalTwinStateResponse
from app.schemas.sensor_data import (
    ESP32TelemetryPayload,
    FrontendTelemetryPayload,
    SensorDataIngest,
    SensorReadingResponse,
)
from app.schemas.tank import TankCreate, TankResponse


def test_section_11_nested_esp32_telemetry_schema():
    """Verify Section 11 nested hardware payload parses properly."""
    raw_payload = {
        "device_id": "ESP32_TANK_01",
        "timestamp": "2026-08-17T09:00:00Z",
        "tank": {
            "distance_cm": 7.2,
            "water_level_percent": 76.0,
        },
        "flow": {
            "flow_1_lpm": 9.8,
            "flow_2_lpm": 8.7,
            "flow_1_total_liters": 120.5,
            "flow_2_total_liters": 115.0,
        },
        "water_quality": {
            "tds_ppm": 117.3,
            "turbidity_raw": 2840,
        },
        "pump": {
            "status": True,
        },
        "device": {
            "wifi_rssi": -52,
            "firmware_version": "0.1.0",
        },
    }

    esp32_obj = ESP32TelemetryPayload.model_validate(raw_payload)
    assert esp32_obj.device_id == "ESP32_TANK_01"
    assert esp32_obj.tank.distance_cm == 7.2
    assert esp32_obj.tank.water_level_percent == 76.0
    assert esp32_obj.flow.flow_1_lpm == 9.8
    assert esp32_obj.flow.flow_2_lpm == 8.7
    assert esp32_obj.water_quality.tds_ppm == 117.3
    assert esp32_obj.water_quality.turbidity_raw == 2840
    assert esp32_obj.pump.status is True
    assert esp32_obj.device.wifi_rssi == -52


def test_sensor_data_ingest_universal_parser_from_nested():
    """Verify SensorDataIngest can ingest Section 11 nested payloads seamlessly."""
    nested_payload = {
        "device_id": "ESP32_TANK_01",
        "tank_id": 1,
        "tank": {
            "distance_cm": 6.0,
            "water_level_percent": 80.0,
        },
        "flow": {
            "flow_1_lpm": 10.0,
            "flow_2_lpm": 8.0,
        },
        "water_quality": {
            "tds_ppm": 150.0,
            "turbidity_raw": 1200,
        },
        "pump": {
            "status": True,
        },
        "device": {
            "wifi_rssi": -50,
            "firmware_version": "0.1.0",
        },
    }

    ingest = SensorDataIngest.model_validate(nested_payload)
    assert ingest.device_id == "ESP32_TANK_01"
    assert ingest.distance_cm == 6.0
    assert ingest.water_level_pct == 80.0
    assert ingest.flow_1_lpm == 10.0
    assert ingest.flow_2_lpm == 8.0
    assert ingest.tds_ppm == 150.0
    assert ingest.turbidity_raw == 1200
    assert ingest.pump_status is True


def test_sensor_data_ingest_universal_parser_from_flat():
    """Verify SensorDataIngest can ingest flat simulated telemetry payloads."""
    flat_payload = {
        "device_id": "ESP32_TANK_01",
        "tank_id": 1,
        "distance_cm": 6.0,
        "water_level_pct": 80.0,
        "flow_1_lpm": 10.0,
        "flow_2_lpm": 9.5,
        "tds_ppm": 130.0,
        "turbidity_raw": 1100,
        "pump_status": True,
        "wifi_rssi": -55,
    }

    ingest = SensorDataIngest.model_validate(flat_payload)
    assert ingest.device_id == "ESP32_TANK_01"
    assert ingest.water_level_pct == 80.0
    assert ingest.flow_1_lpm == 10.0


def test_sensor_data_ingest_validation_errors():
    """Verify invalid sensor ranges are rejected by Pydantic validators."""
    with pytest.raises(ValidationError):
        SensorDataIngest(
            device_id="ESP32_TANK_01",
            distance_cm=-5.0,  # Negative distance invalid
            water_level_pct=80.0,
        )

    with pytest.raises(ValidationError):
        SensorDataIngest(
            device_id="ESP32_TANK_01",
            distance_cm=5.0,
            water_level_pct=150.0,  # >100% invalid
        )


def test_digital_twin_state_response_schema():
    """Verify Section 14 DigitalTwinStateResponse schema matches spec."""
    dt_payload = {
        "tank_id": 1,
        "tank_name": "Main Benchtop Tank",
        "location": "Sector 4",
        "tank_level_percent": 76.0,
        "distance_cm": 7.2,
        "capacity_liters": 20.0,
        "current_volume_liters": 15.2,
        "flow_in": 9.8,
        "flow_out": 8.7,
        "water_loss": 1.1,
        "flow_1_total_liters": 120.0,
        "flow_2_total_liters": 115.0,
        "tds": 117.3,
        "turbidity": "Clear",
        "turbidity_raw": 2840,
        "water_quality_status": "Good",
        "pump": "ON",
        "system_status": "Optimal",
        "leak_probability": 0.0,
        "possible_leak": False,
        "last_updated": datetime.now(timezone.utc),
    }

    dt_obj = DigitalTwinStateResponse.model_validate(dt_payload)
    assert dt_obj.tank_level_percent == 76.0
    assert dt_obj.water_loss == 1.1
    assert dt_obj.pump == "ON"
    assert dt_obj.system_status == "Optimal"


def test_frontend_telemetry_payload_schema():
    """Verify FrontendTelemetryPayload produces exact shape expected by Zustand store."""
    payload = FrontendTelemetryPayload(
        timestamp=datetime.now(timezone.utc).isoformat(),
        pressure=3.8,
        flowRate=42.6,
        tankLevel=72.0,
        tankCapacityLiters=20.0,
        pumpStatus="running",
        pumpRPM=1450,
        dailyConsumptionLiters=18450.0,
        hourlyConsumptionLiters=1250.0,
        leakProbability=0.08,
        pumpHealthScore=94,
        valveStatus="OPEN",
        waterTurbidityNTU=0.4,
        pHLevel=7.2,
    )
    dumped = payload.model_dump()
    assert "tankLevel" in dumped
    assert "pumpStatus" in dumped
    assert "leakProbability" in dumped
    assert dumped["tankLevel"] == 72.0
