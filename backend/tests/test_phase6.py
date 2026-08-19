import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tank import Tank
from app.repositories.tank import TankRepository
from app.repositories.tank_state import TankStateRepository
from app.schemas.tank import TankCreate


@pytest.mark.asyncio
async def test_digital_twin_endpoint_serves_from_tank_state(
    client: AsyncClient, db_session: AsyncSession
):
    """Verify Section 14 Digital Twin endpoint reads directly from TANK_STATE table."""
    tank_repo = TankRepository(db_session)
    tank = await tank_repo.create(
        {
            "name": "Village Tank Alpha",
            "location": "North Sector",
            "capacity": 20.0,
            "height_cm": 30.0,
            "flow_1_calibration": 7.5,
            "flow_2_calibration": 7.5,
            "status": "Active",
        }
    )

    state_repo = TankStateRepository(db_session)
    await state_repo.upsert_state(
        tank.id,
        {
            "water_level_percent": 76.0,
            "distance_cm": 7.2,
            "flow_in_lpm": 9.8,
            "flow_out_lpm": 8.7,
            "water_loss_lpm": 1.1,
            "flow_1_total_liters": 120.0,
            "flow_2_total_liters": 115.0,
            "tds_ppm": 117.3,
            "turbidity_raw": 2840,
            "turbidity_status": "Clear",
            "water_quality_status": "Good",
            "pump_status": "ON",
            "system_status": "Warning",
            "leak_probability": 0.15,
            "possible_leak": False,
        },
    )

    response = await client.get(f"/api/v1/digital-twin/{tank.id}")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["tank_id"] == tank.id
    assert data["tank_level_percent"] == 76.0
    assert data["flow_in"] == 9.8
    assert data["flow_out"] == 8.7
    assert data["water_loss"] == 1.1
    assert data["tds"] == 117.3
    assert data["turbidity"] == "Clear"
    assert data["pump"] == "ON"
    assert data["system_status"] == "Warning"


@pytest.mark.asyncio
async def test_analytics_consumption_endpoint(client: AsyncClient):
    """Verify consumption analytics endpoint returns structured data points for charts."""
    response = await client.get("/api/v1/analytics/consumption?timeframe=daily")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert "total_consumption_liters" in data
    assert "data" in data
    assert len(data["data"]) > 0


@pytest.mark.asyncio
async def test_tank_crud_lifecycle(
    client: AsyncClient, admin_token_headers: dict
):
    """Verify Tank creation, retrieval, update, and deletion."""
    # 1. Create Tank
    create_payload = {
        "name": "Benchtop Tank Beta",
        "location": "Lab Bench 2",
        "capacity": 25.0,
        "height_cm": 30.0,
        "flow_1_calibration": 7.5,
        "flow_2_calibration": 7.5,
        "status": "Active",
    }
    create_resp = await client.post(
        "/api/v1/tanks",
        json=create_payload,
        headers=admin_token_headers,
    )
    assert create_resp.status_code == 201
    tank_id = create_resp.json()["data"]["id"]

    # 2. Get Tank
    get_resp = await client.get(f"/api/v1/tanks/{tank_id}", headers=admin_token_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["name"] == "Benchtop Tank Beta"

    # 3. Update Tank
    update_resp = await client.put(
        f"/api/v1/tanks/{tank_id}",
        json={"name": "Benchtop Tank Beta Updated", "capacity": 30.0},
        headers=admin_token_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["data"]["capacity"] == 30.0

    # 4. Delete Tank
    del_resp = await client.delete(f"/api/v1/tanks/{tank_id}", headers=admin_token_headers)
    assert del_resp.status_code == 200


@pytest.mark.asyncio
async def test_device_registration_endpoint(
    client: AsyncClient, admin_token_headers: dict
):
    """Verify Device registration endpoint with hardware device ID."""
    reg_payload = {
        "device_id": "ESP32_TANK_02",
        "device_name": "Secondary ESP32 Controller",
        "device_type": "ESP32_CONTROLLER",
        "protocol": "WiFi",
        "location": "Benchtop Prototype",
        "firmware_version": "0.1.0",
        "wifi_rssi": -55,
        "status": "Online",
    }
    resp = await client.post(
        "/api/v1/devices/register",
        json=reg_payload,
        headers=admin_token_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["data"]["device_id"] == "ESP32_TANK_02"
