import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tank import Tank
from app.repositories.tank import TankRepository
from app.repositories.tank_state import TankStateRepository
from app.services.physics import PhysicsService


def test_physics_water_level_calculation():
    """Verify Section 6 water level and volume calculation from ultrasonic distance."""
    physics = PhysicsService()

    # Tank Height = 30cm, Measured Distance = 6cm -> Water Height = 24cm -> 80%
    result = physics.calculate_water_level(
        distance_cm=6.0,
        tank_height_cm=30.0,
        capacity_liters=20.0,
    )

    assert result["distance_cm"] == 6.0
    assert result["water_height_cm"] == 24.0
    assert result["water_level_percent"] == 80.0
    assert result["current_volume_liters"] == 16.0


def test_physics_differential_flow_calculation():
    """Verify Section 8 differential flow and non-negative water loss."""
    physics = PhysicsService()

    # Flow 1 = 10.0 LPM, Flow 2 = 7.0 LPM -> Diff = 3.0 LPM
    result = physics.calculate_differential_flow(flow_1_lpm=10.0, flow_2_lpm=7.0)
    assert result["flow_difference_lpm"] == 3.0
    assert result["estimated_water_loss_lpm"] == 3.0

    # Flow 1 = 8.0 LPM, Flow 2 = 8.2 LPM (transient sensor noise) -> Diff = -0.2 LPM -> loss = 0.0
    result_neg = physics.calculate_differential_flow(flow_1_lpm=8.0, flow_2_lpm=8.2)
    assert result_neg["flow_difference_lpm"] == -0.2
    assert result_neg["estimated_water_loss_lpm"] == 0.0


def test_physics_stateful_leak_detection_persistence():
    """Verify leak is only flagged after N consecutive breaches."""
    physics = PhysicsService()
    tank_id = 99
    physics.reset_leak_state(tank_id)

    # 1st breach: diff = 2.0 LPM (threshold = 0.5)
    r1 = physics.evaluate_stateful_leak(tank_id=tank_id, flow_1_lpm=10.0, flow_2_lpm=8.0, pump_status=True)
    assert r1["possible_leak"] is False
    assert r1["consecutive_breaches"] == 1

    # 2nd breach
    r2 = physics.evaluate_stateful_leak(tank_id=tank_id, flow_1_lpm=10.0, flow_2_lpm=8.0, pump_status=True)
    assert r2["possible_leak"] is False
    assert r2["consecutive_breaches"] == 2

    # 3rd breach -> Threshold (N=3) reached!
    r3 = physics.evaluate_stateful_leak(tank_id=tank_id, flow_1_lpm=10.0, flow_2_lpm=8.0, pump_status=True)
    assert r3["possible_leak"] is True
    assert r3["consecutive_breaches"] == 3
    assert r3["leak_probability"] >= 0.70


def test_physics_water_quality_classification():
    """Verify Section 9 TDS and Turbidity status bands."""
    physics = PhysicsService()

    # Clean water: TDS 150 (Good), Turbidity 1000 (Clear)
    q1 = physics.classify_water_quality(tds_ppm=150.0, turbidity_raw=1000)
    assert q1["tds_status"] == "Good"
    assert q1["turbidity_status"] == "Clear"
    assert q1["water_quality_status"] == "Good"

    # Moderate turbidity
    q2 = physics.classify_water_quality(tds_ppm=400.0, turbidity_raw=2200)
    assert q2["tds_status"] == "Monitor"
    assert q2["turbidity_status"] == "Moderate"
    assert q2["water_quality_status"] == "Monitor"

    # Contaminated water
    q3 = physics.classify_water_quality(tds_ppm=850.0, turbidity_raw=3500)
    assert q3["tds_status"] == "High"
    assert q3["turbidity_status"] == "High"
    assert q3["water_quality_status"] == "High"


@pytest.mark.asyncio
async def test_full_sensor_ingestion_pipeline(client: AsyncClient, db_session: AsyncSession):
    """Verify end-to-end ingestion pipeline with Section 11 nested payload."""
    tank_repo = TankRepository(db_session)
    tank = await tank_repo.create(
        {"name": "Benchtop Tank", "location": "Lab", "capacity": 20.0, "height_cm": 30.0}
    )

    nested_payload = {
        "device_id": "ESP32_TANK_01",
        "tank_id": tank.id,
        "tank": {
            "distance_cm": 6.0,
            "water_level_percent": 80.0,
        },
        "flow": {
            "flow_1_lpm": 9.8,
            "flow_2_lpm": 8.7,
            "flow_1_total_liters": 120.0,
            "flow_2_total_liters": 115.0,
        },
        "water_quality": {
            "tds_ppm": 120.0,
            "turbidity_raw": 1100,
        },
        "pump": {
            "status": True,
        },
        "device": {
            "wifi_rssi": -52,
            "firmware_version": "0.1.0",
        },
    }

    # Test POST /api/v1/sensor-data
    response = await client.post("/api/v1/sensor-data", json=nested_payload)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["flow_1_lpm"] == 9.8
    assert res_json["data"]["flow_2_lpm"] == 8.7
    assert res_json["data"]["flow_difference_lpm"] == 1.1

    # Verify singleton TANK_STATE was atomically upserted
    state_repo = TankStateRepository(db_session)
    state = await state_repo.get_by_tank(tank.id)
    assert state is not None
    assert state.water_level_percent == 80.0
    assert state.flow_in_lpm == 9.8
    assert state.flow_out_lpm == 8.7
    assert state.water_loss_lpm == 1.1
    assert state.pump_status == "ON"
    assert state.tds_ppm == 120.0

    # Test trailing slash compatibility: POST /api/v1/sensor-data/
    response_slash = await client.post("/api/v1/sensor-data/", json=nested_payload)
    assert response_slash.status_code == 201

    # Test GET /api/v1/sensor-data/latest
    latest_resp = await client.get("/api/v1/sensor-data/latest")
    assert latest_resp.status_code == 200
    latest_data = latest_resp.json()["data"]
    assert latest_data["tankLevel"] == 80.0
    assert latest_data["flowRate"] == 9.8
    assert latest_data["pumpStatus"] == "running"
