import pytest
from httpx import AsyncClient
from app.models.user import User


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, admin_user: User):
    """Test login with valid email and password."""
    payload = {
        "email": "admin@aquasage.io",
        "password": "AdminPass123!",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert "access_token" in res["data"]
    assert "refresh_token" in res["data"]
    assert res["data"]["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, admin_user: User):
    """Test login with wrong password returns 401."""
    payload = {
        "email": "admin@aquasage.io",
        "password": "WrongPassword!",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    res = response.json()
    assert res["success"] is False
    assert "Invalid email or password" in res["message"]


@pytest.mark.asyncio
async def test_get_current_user_profile(client: AsyncClient, admin_token_headers: dict):
    """Test authenticated request to /api/v1/auth/me."""
    response = await client.get("/api/v1/auth/me", headers=admin_token_headers)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["data"]["email"] == "admin@aquasage.io"
    assert res["data"]["role"] == "Admin"


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, admin_user: User):
    """Test refresh token flow."""
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@aquasage.io", "password": "AdminPass123!"},
    )
    refresh_token = login_resp.json()["data"]["refresh_token"]

    refresh_resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    res = refresh_resp.json()
    assert res["success"] is True
    assert "access_token" in res["data"]
