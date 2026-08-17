import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_can_create_user(client: AsyncClient, admin_token_headers: dict):
    """Test Admin can create a new user account."""
    new_user = {
        "name": "Engineer User",
        "email": "engineer@aquasage.io",
        "password": "EngineerPass123!",
        "role": "Engineer",
        "is_active": True,
    }
    response = await client.post("/api/v1/users", json=new_user, headers=admin_token_headers)
    assert response.status_code == 201
    res = response.json()
    assert res["success"] is True
    assert res["data"]["email"] == "engineer@aquasage.io"
    assert res["data"]["role"] == "Engineer"


@pytest.mark.asyncio
async def test_viewer_cannot_create_user(client: AsyncClient, viewer_token_headers: dict):
    """Test Viewer is forbidden (403) from creating a user."""
    new_user = {
        "name": "Forbidden User",
        "email": "forbidden@aquasage.io",
        "password": "Password123!",
        "role": "Viewer",
    }
    response = await client.post("/api/v1/users", json=new_user, headers=viewer_token_headers)
    assert response.status_code == 403
    res = response.json()
    assert res["success"] is False
    assert "Permission denied" in res["message"] or "Role 'Viewer' does not have sufficient permissions" in res["message"]
