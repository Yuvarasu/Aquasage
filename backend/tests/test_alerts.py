import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_scada_alerts_and_acknowledgment(client: AsyncClient, admin_token_headers: dict):
    """Test fetching alarms and acknowledging an alarm."""
    # 1. Fetch initial alarms list
    alerts_resp = await client.get("/api/v1/alerts")
    assert alerts_resp.status_code == 200
    assert alerts_resp.json()["success"] is True

    # 2. Trigger automated alarm via critical sensor data ingestion (Water level < 20%)
    tank_resp = await client.post(
        "/api/v1/tanks",
        json={"name": "Low Water Test Tank", "location": "Village B", "capacity": 30000.0, "status": "Active"},
        headers=admin_token_headers,
    )
    tank_id = tank_resp.json()["data"]["id"]

    device_resp = await client.post(
        "/api/v1/devices/register",
        json={"node_name": "Low-Water-Sensor-Node", "location": "Village B", "tank_id": tank_id},
        headers=admin_token_headers,
    )
    device_id = device_resp.json()["data"]["id"]

    # Ingest low water level (15%)
    await client.post(
        "/api/v1/sensor-data",
        json={
            "device_id": device_id,
            "tank_id": tank_id,
            "distance_cm": 85.0,
            "water_level_pct": 15.0,
            "flow_rate_lmin": 10.0,
            "tds_ppm": 120.0,
        },
    )

    # 3. Check that SCADA alarm was generated
    updated_alerts_resp = await client.get("/api/v1/alerts")
    assert updated_alerts_resp.status_code == 200
    alarms = updated_alerts_resp.json()["data"]
    assert len(alarms) >= 1
    target_alarm = alarms[0]
    alarm_id = target_alarm["id"]

    # 4. Acknowledge Alarm
    ack_resp = await client.post(f"/api/v1/alerts/{alarm_id}/acknowledge")
    assert ack_resp.status_code == 200
    assert ack_resp.json()["data"]["acknowledged"] is True
