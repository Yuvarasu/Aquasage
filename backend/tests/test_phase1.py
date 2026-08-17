import pytest
from httpx import AsyncClient
from app.core.config import settings


def test_prototype_configuration_defaults():
    """Verify benchtop prototype physical parameters and thresholds."""
    assert settings.DEFAULT_TANK_HEIGHT_CM == 30.0
    assert settings.DEFAULT_TANK_CAPACITY_LITERS == 20.0
    assert settings.FLOW_SENSOR_1_CALIBRATION_FACTOR == 7.5
    assert settings.FLOW_SENSOR_2_CALIBRATION_FACTOR == 7.5
    assert settings.LEAK_MINIMUM_FLOW_LPM == 1.0
    assert settings.LEAK_DIFFERENTIAL_THRESHOLD_LPM == 0.5
    assert settings.LEAK_CONSECUTIVE_READINGS_THRESHOLD == 3
    assert settings.TDS_THRESHOLD_GOOD_PPM == 300.0
    assert settings.TDS_THRESHOLD_MONITOR_PPM == 600.0
    assert settings.TURBIDITY_THRESHOLD_CLEAR_RAW == 1500
    assert settings.TURBIDITY_THRESHOLD_MODERATE_RAW == 3000


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    """Verify health check endpoint returns 200 OK and valid health metadata."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    payload = response.json()
    assert "status" in payload
    assert payload["status"] == "healthy"


@pytest.mark.asyncio
async def test_system_status_endpoint(client: AsyncClient):
    """Verify system status endpoint returns 200 OK and operational state."""
    response = await client.get("/api/v1/system/status")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["status"] == "operational"
