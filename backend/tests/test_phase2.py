import pytest
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import SCADAAlarmModel
from app.models.device import DeviceNode
from app.models.prediction import Prediction
from app.models.sensor_reading import SensorReading
from app.models.tank import Tank
from app.models.tank_state import TankState
from app.repositories.alert import AlertRepository
from app.repositories.device import DeviceRepository
from app.repositories.prediction import PredictionRepository
from app.repositories.sensor_reading import SensorReadingRepository
from app.repositories.tank import TankRepository
from app.repositories.tank_state import TankStateRepository


@pytest.mark.asyncio
async def test_tank_model_creation_and_defaults(db_session: AsyncSession):
    """Verify Tank model stores configurable dimensions and calibration factors."""
    tank_repo = TankRepository(db_session)
    tank = await tank_repo.create(
        {
            "name": "Village Tank 01",
            "location": "Sector 4",
            "capacity": 25.0,
            "height_cm": 30.0,
            "diameter_cm": 28.0,
            "flow_1_calibration": 7.5,
            "flow_2_calibration": 7.5,
            "status": "Active",
        }
    )

    assert tank.id is not None
    assert tank.height_cm == 30.0
    assert tank.capacity == 25.0
    assert tank.flow_1_calibration == 7.5
    assert tank.flow_2_calibration == 7.5


@pytest.mark.asyncio
async def test_device_node_registration(db_session: AsyncSession):
    """Verify DeviceNode model supports hardware device IDs."""
    tank_repo = TankRepository(db_session)
    tank = await tank_repo.create(
        {"name": "Benchtop Tank", "location": "Lab", "capacity": 20.0, "height_cm": 30.0}
    )

    device_repo = DeviceRepository(db_session)
    device = await device_repo.create(
        {
            "device_id": "ESP32_TANK_01",
            "device_name": "ESP32 DevKit Primary",
            "device_type": "ESP32_CONTROLLER",
            "protocol": "WiFi",
            "location": "Benchtop Lab",
            "firmware_version": "0.1.0",
            "wifi_rssi": -52,
            "status": "Online",
            "tank_id": tank.id,
        }
    )

    assert device.id is not None
    assert device.device_id == "ESP32_TANK_01"

    found_device = await device_repo.get_by_device_id("ESP32_TANK_01")
    assert found_device is not None
    assert found_device.id == device.id


@pytest.mark.asyncio
async def test_sensor_reading_time_series(db_session: AsyncSession):
    """Verify SensorReading stores dual flow, differential water loss, TDS and raw turbidity."""
    tank_repo = TankRepository(db_session)
    tank = await tank_repo.create(
        {"name": "Benchtop Tank", "location": "Lab", "capacity": 20.0, "height_cm": 30.0}
    )

    reading_repo = SensorReadingRepository(db_session)
    reading = await reading_repo.create(
        {
            "device_id": "ESP32_TANK_01",
            "tank_id": tank.id,
            "distance_cm": 6.0,
            "water_level_pct": 80.0,
            "flow_1_lpm": 9.8,
            "flow_2_lpm": 8.7,
            "flow_1_total_liters": 120.5,
            "flow_2_total_liters": 115.0,
            "flow_difference_lpm": 1.1,
            "estimated_water_loss_lpm": 1.1,
            "possible_leak": True,
            "leak_probability": 0.35,
            "tds_ppm": 145.0,
            "turbidity_raw": 1200,
            "turbidity_status": "Clear",
            "water_quality_status": "Good",
            "pump_status": True,
            "wifi_rssi": -50,
            "timestamp": datetime.now(timezone.utc),
        }
    )

    assert reading.id is not None
    assert reading.flow_1_lpm == 9.8
    assert reading.flow_2_lpm == 8.7
    assert reading.flow_difference_lpm == 1.1
    assert reading.turbidity_raw == 1200
    assert reading.possible_leak is True


@pytest.mark.asyncio
async def test_tank_state_singleton_upsert(db_session: AsyncSession):
    """Verify TankState maintains a single latest state per tank via atomic upsert."""
    tank_repo = TankRepository(db_session)
    tank = await tank_repo.create(
        {"name": "Benchtop Tank", "location": "Lab", "capacity": 20.0, "height_cm": 30.0}
    )

    state_repo = TankStateRepository(db_session)

    # Initial upsert
    initial_data = {
        "water_level_percent": 75.0,
        "distance_cm": 7.5,
        "flow_in_lpm": 10.0,
        "flow_out_lpm": 9.5,
        "water_loss_lpm": 0.5,
        "flow_1_total_liters": 10.0,
        "flow_2_total_liters": 9.5,
        "tds_ppm": 150.0,
        "turbidity_raw": 1100,
        "turbidity_status": "Clear",
        "water_quality_status": "Good",
        "pump_status": "ON",
        "system_status": "Optimal",
        "leak_probability": 0.0,
        "possible_leak": False,
        "last_telemetry_at": datetime.now(timezone.utc),
    }

    state1 = await state_repo.upsert_state(tank.id, initial_data)
    assert state1.tank_id == tank.id
    assert state1.water_level_percent == 75.0

    # Subsequent update (should update the existing row, not insert a duplicate)
    update_data = {
        "water_level_percent": 82.0,
        "flow_in_lpm": 12.0,
        "flow_out_lpm": 8.0,
        "water_loss_lpm": 4.0,
        "possible_leak": True,
        "system_status": "Warning",
    }
    state2 = await state_repo.upsert_state(tank.id, update_data)
    assert state2.tank_id == tank.id
    assert state2.water_level_percent == 82.0
    assert state2.water_loss_lpm == 4.0
    assert state2.possible_leak is True
    assert state2.system_status == "Warning"

    # Total rows in tank_states should be 1
    total_states = await state_repo.count()
    assert total_states == 1


@pytest.mark.asyncio
async def test_alert_and_prediction_models(db_session: AsyncSession):
    """Verify Alert and Prediction models persist properly."""
    tank_repo = TankRepository(db_session)
    tank = await tank_repo.create(
        {"name": "Benchtop Tank", "location": "Lab", "capacity": 20.0, "height_cm": 30.0}
    )

    alert_repo = AlertRepository(db_session)
    alert = await alert_repo.create(
        {
            "tank_id": tank.id,
            "alarm_code": "LEAK_01",
            "type": "Leak",
            "title": "High Water Loss Detected",
            "message": "Differential flow between FS1 and FS2 exceeded 3.0 LPM.",
            "severity": "critical",
            "source_node": "ESP32_TANK_01",
            "acknowledged": False,
            "timestamp": datetime.now(timezone.utc),
        }
    )
    assert alert.id is not None
    assert alert.severity == "critical"

    prediction_repo = PredictionRepository(db_session)
    prediction = await prediction_repo.create(
        {
            "tank_id": tank.id,
            "model_name": "RandomForestLeakDetector_v1",
            "prediction_type": "leak_probability",
            "predicted_value": 0.88,
            "confidence": 0.94,
            "features_snapshot": '{"flow_in": 10.0, "flow_out": 6.5, "delta": 3.5}',
            "timestamp": datetime.now(timezone.utc),
        }
    )
    assert prediction.id is not None
    assert prediction.predicted_value == 0.88
