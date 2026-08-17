import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_digital_twin_endpoint(client: AsyncClient, admin_token_headers: dict):
    """Test Digital Twin API response structure for a water storage tank."""
    # 1. Create Tank
    tank_resp = await client.post(
        "/api/v1/tanks",
        json={
            "name": "Elevated District Reservoir 01",
            "location": "North Hill",
            "capacity": 50000.0,
            "status": "Active",
        },
        headers=admin_token_headers,
    )
    assert tank_resp.status_code == 201
    tank_id = tank_resp.json()["data"]["id"]

    # 2. Fetch Digital Twin model
    dt_resp = await client.get(f"/api/v1/digital-twin/{tank_id}")
    assert dt_resp.status_code == 200
    res = dt_resp.json()
    assert res["success"] is True
    twin = res["data"]
    assert twin["tank_id"] == tank_id
    assert twin["tank_name"] == "Elevated District Reservoir 01"
    assert "current_level_pct" in twin
    assert "current_volume_liters" in twin
    assert "water_quality" in twin
    assert "pump_state" in twin
    assert "ai_insights" in twin
    assert twin["water_quality"]["status"] in ["Safe", "Unsafe"]
