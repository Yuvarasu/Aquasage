import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tank import Tank
from app.repositories.alert import AlertRepository
from app.repositories.tank import TankRepository
from app.repositories.tank_state import TankStateRepository
from app.services.physics import physics_service


@pytest.mark.asyncio
async def test_scenario_1_normal_circulation(client: AsyncClient, db_session: AsyncSession):
    """Scenario 1: Normal balanced closed-loop water circulation."""
    tank_repo = TankRepository(db_session)
    tank = await tank_repo.create(
        {"name": "Benchtop Tank", "location": "Lab Bench", "capacity": 20.0, "height_cm": 30.0}
    )
    physics_service.reset_leak_state(tank.id)

    normal_payload = {
        "device_id": "ESP32_TANK_01",
        "tank_id": tank.id,
        "tank": {"distance_cm": 6.0, "water_level_percent": 80.0},
        "flow": {"flow_1_lpm": 9.8, "flow_2_lpm": 9.7, "flow_1_total_liters": 10.0, "flow_2_total_liters": 9.9},
        "water_quality": {"tds_ppm": 125.0, "turbidity_raw": 1050},
        "pump": {"status": True},
        "device": {"wifi_rssi": -52, "firmware_version": "0.1.0"},
    }

    resp = await client.post("/api/v1/sensor-data", json=normal_payload)
    assert resp.status_code == 201
    data = resp.json()["data"]

    assert data["water_level_pct"] == 80.0
    assert data["flow_1_lpm"] == 9.8
    assert data["flow_2_lpm"] == 9.7
    assert data["flow_difference_lpm"] == 0.1
    assert data["possible_leak"] is False
    assert data["water_quality_status"] == "Good"

    # Verify Digital Twin reflects Optimal state
    dt_resp = await client.get(f"/api/v1/digital-twin/{tank.id}")
    assert dt_resp.status_code == 200
    dt_data = dt_resp.json()["data"]
    assert dt_data["system_status"] == "Optimal"
    assert dt_data["pump"] == "ON"


@pytest.mark.asyncio
async def test_scenario_2_pipeline_leak_detection(client: AsyncClient, db_session: AsyncSession):
    """Scenario 2: Pipe leak anomaly with N=3 consecutive sample persistence."""
    tank_repo = TankRepository(db_session)
    tank = await tank_repo.create(
        {"name": "Benchtop Tank", "location": "Lab Bench", "capacity": 20.0, "height_cm": 30.0}
    )
    physics_service.reset_leak_state(tank.id)

    leak_payload = {
        "device_id": "ESP32_TANK_01",
        "tank_id": tank.id,
        "tank": {"distance_cm": 7.0, "water_level_percent": 76.6},
        "flow": {"flow_1_lpm": 10.0, "flow_2_lpm": 6.8, "flow_1_total_liters": 25.0, "flow_2_total_liters": 17.0},
        "water_quality": {"tds_ppm": 130.0, "turbidity_raw": 1100},
        "pump": {"status": True},
        "device": {"wifi_rssi": -55, "firmware_version": "0.1.0"},
    }

    # Packet 1 & 2 (persistence warming)
    await client.post("/api/v1/sensor-data", json=leak_payload)
    await client.post("/api/v1/sensor-data", json=leak_payload)

    # Packet 3 (triggers leak flag)
    resp3 = await client.post("/api/v1/sensor-data", json=leak_payload)
    assert resp3.status_code == 201
    data3 = resp3.json()["data"]

    assert data3["flow_difference_lpm"] == 3.2
    assert data3["estimated_water_loss_lpm"] == 3.2
    assert data3["possible_leak"] is True
    assert data3["leak_probability"] >= 0.70

    # Verify Digital Twin reflects leak warning
    dt_resp = await client.get(f"/api/v1/digital-twin/{tank.id}")
    assert dt_resp.status_code == 200
    assert dt_resp.json()["data"]["possible_leak"] is True

    # Verify LEAK_DETECTED alert created
    alert_repo = AlertRepository(db_session)
    active_alarms = await alert_repo.get_active_alarms()
    leak_alarms = [a for a in active_alarms if a.alarm_code == "LEAK_DETECTED"]
    assert len(leak_alarms) == 1


@pytest.mark.asyncio
async def test_scenario_3_water_quality_contamination(client: AsyncClient, db_session: AsyncSession):
    """Scenario 3: Contamination spike triggering TDS and Turbidity alarms."""
    tank_repo = TankRepository(db_session)
    tank = await tank_repo.create(
        {"name": "Benchtop Tank", "location": "Lab Bench", "capacity": 20.0, "height_cm": 30.0}
    )

    contam_payload = {
        "device_id": "ESP32_TANK_01",
        "tank_id": tank.id,
        "tank": {"distance_cm": 6.0, "water_level_percent": 80.0},
        "flow": {"flow_1_lpm": 9.8, "flow_2_lpm": 9.7},
        "water_quality": {"tds_ppm": 780.0, "turbidity_raw": 3400},  # Both High
        "pump": {"status": True},
        "device": {"wifi_rssi": -50, "firmware_version": "0.1.0"},
    }

    resp = await client.post("/api/v1/sensor-data", json=contam_payload)
    assert resp.status_code == 201
    data = resp.json()["data"]

    assert data["tds_ppm"] == 780.0
    assert data["turbidity_raw"] == 3400
    assert data["turbidity_status"] == "High"
    assert data["water_quality_status"] == "High"

    # Verify Digital Twin shows Critical/Warning
    dt_resp = await client.get(f"/api/v1/digital-twin/{tank.id}")
    assert dt_resp.status_code == 200
    assert dt_resp.json()["data"]["water_quality_status"] == "High"


@pytest.mark.asyncio
async def test_scenario_4_low_water_level_alert(client: AsyncClient, db_session: AsyncSession):
    """Scenario 4: Tank low level (<20%) triggering safety alert."""
    tank_repo = TankRepository(db_session)
    tank = await tank_repo.create(
        {"name": "Benchtop Tank", "location": "Lab Bench", "capacity": 20.0, "height_cm": 30.0}
    )

    low_payload = {
        "device_id": "ESP32_TANK_01",
        "tank_id": tank.id,
        "tank": {"distance_cm": 26.5, "water_level_percent": 11.7},
        "flow": {"flow_1_lpm": 0.0, "flow_2_lpm": 0.0},
        "water_quality": {"tds_ppm": 130.0, "turbidity_raw": 1050},
        "pump": {"status": False},
        "device": {"wifi_rssi": -55, "firmware_version": "0.1.0"},
    }

    resp = await client.post("/api/v1/sensor-data", json=low_payload)
    assert resp.status_code == 201
    data = resp.json()["data"]

    assert abs(data["water_level_pct"] - 11.7) < 0.1
    assert data["pump_status"] is False

    alert_repo = AlertRepository(db_session)
    active_alarms = await alert_repo.get_active_alarms()
    low_water_alarms = [a for a in active_alarms if a.alarm_code == "LOW_WATER_LEVEL"]
    assert len(low_water_alarms) == 1
