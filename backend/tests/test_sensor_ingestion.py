import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_sensor_ingestion_and_validation(client: AsyncClient, admin_token_headers: dict):
    """Test registering a Tank, Device, and ingesting validated sensor readings."""
    # 1. Register Tank
    tank_resp = await client.post(
        "/api/v1/tanks",
        json={
            "name": "Central Reservoir Tank 01",
            "location": "Sector 4, Main Village",
            "capacity": 50000.0,
            "status": "Active",
        },
        headers=admin_token_headers,
    )
    assert tank_resp.status_code == 201
    tank_id = tank_resp.json()["data"]["id"]

    # 2. Register Device
    device_resp = await client.post(
        "/api/v1/devices/register",
        json={
            "node_name": "ESP32-Ingestion-Node-01",
            "node_type": "Sensor",
            "protocol": "WiFi",
            "location": "Reservoir Pump House",
            "firmware_version": "v2.4.1",
            "tank_id": tank_id,
        },
        headers=admin_token_headers,
    )
    assert device_resp.status_code == 201
    device_id = device_resp.json()["data"]["id"]

    # 3. Ingest Valid Sensor Data
    ingest_payload = {
        "device_id": device_id,
        "tank_id": tank_id,
        "distance_cm": 28.0,
        "water_level_pct": 72.0,
        "flow_rate_lmin": 42.6,
        "daily_consumption_liters": 18450.0,
        "hourly_consumption_liters": 1250.0,
        "tds_ppm": 140.0,
        "ph_level": 7.2,
        "turbidity_ntu": 0.4,
        "pressure_bar": 3.8,
    }
    ingest_resp = await client.post("/api/v1/sensor-data", json=ingest_payload)
    assert ingest_resp.status_code == 201
    res_data = ingest_resp.json()["data"]
    assert res_data["water_level_pct"] == 72.0
    assert res_data["water_quality_status"] == "Safe"

    # 4. Fetch Latest Telemetry (matching frontend Zustand store interface)
    latest_resp = await client.get("/api/v1/sensor-data/latest")
    assert latest_resp.status_code == 200
    telemetry = latest_resp.json()["data"]
    assert telemetry["pressure"] == 3.8
    assert telemetry["flowRate"] == 42.6
    assert telemetry["tankLevel"] == 72.0

    # 5. Validation Test: Invalid TDS (>5000)
    bad_tds_payload = {**ingest_payload, "tds_ppm": 9999.0}
    bad_tds_resp = await client.post("/api/v1/sensor-data", json=bad_tds_payload)
    assert bad_tds_resp.status_code == 422
    assert "5000" in bad_tds_resp.json()["message"] or "tds_ppm" in bad_tds_resp.json()["message"]

    # 6. Validation Test: Negative Flow Rate
    bad_flow_payload = {**ingest_payload, "flow_rate_lmin": -10.0}
    bad_flow_resp = await client.post("/api/v1/sensor-data", json=bad_flow_payload)
    assert bad_flow_resp.status_code == 422
    assert "greater than or equal to 0" in bad_flow_resp.json()["message"] or "flow_rate_lmin" in bad_flow_resp.json()["message"]
