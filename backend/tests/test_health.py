import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test GET /api/v1/health returns healthy status."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "redis" in data
    assert data["database"] == "connected"


@pytest.mark.asyncio
async def test_system_status(client: AsyncClient):
    """Test GET /api/v1/system/status returns detailed system metrics."""
    response = await client.get("/api/v1/system/status")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["data"]["status"] == "operational"
    assert "cpu_percent" in res["data"]
    assert "memory_usage_mb" in res["data"]
