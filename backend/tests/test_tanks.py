import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_tank_and_sensor_node_workflow(client: AsyncClient, admin_token_headers: dict):
    """Test full workflow of registering a Tank and adding a SensorNode."""
    # 1. Create Tank
    tank_payload = {
        "name": "North Sector Storage Tank 1",
        "location": "District 4, Village Alpha",
        "capacity": 50000.0,
        "status": "Active",
    }
    tank_resp = await client.post("/api/v1/tanks", json=tank_payload, headers=admin_token_headers)
    assert tank_resp.status_code == 201
    tank_data = tank_resp.json()["data"]
    tank_id = tank_data["id"]

    # 2. Get Tanks list
    list_resp = await client.get("/api/v1/tanks", headers=admin_token_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()["data"]) >= 1

    # 3. Create Sensor Node for Tank
    sensor_payload = {
        "tank_id": tank_id,
        "node_name": "ESP32-Flow-Pressure-Node-01",
        "status": "Online",
    }
    sensor_resp = await client.post("/api/v1/sensor-nodes", json=sensor_payload, headers=admin_token_headers)
    assert sensor_resp.status_code == 201
    sensor_data = sensor_resp.json()["data"]
    assert sensor_data["tank_id"] == tank_id
    assert sensor_data["node_name"] == "ESP32-Flow-Pressure-Node-01"

    # 4. Fetch Sensor Nodes by Tank
    by_tank_resp = await client.get(f"/api/v1/sensor-nodes/tank/{tank_id}", headers=admin_token_headers)
    assert by_tank_resp.status_code == 200
    nodes = by_tank_resp.json()["data"]
    assert len(nodes) == 1
    assert nodes[0]["node_name"] == "ESP32-Flow-Pressure-Node-01"
