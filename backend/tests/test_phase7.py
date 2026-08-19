import json
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.websocket.manager import connection_manager


def test_websocket_global_stream_connection_and_hydration():
    """Verify WebSocket /ws connection, initial greeting, telemetry hydration, and ping/pong."""
    client = TestClient(app)

    with client.websocket_connect("/ws") as websocket:
        # 1. First frame: Greeting
        frame1 = websocket.receive_json()
        assert frame1["event"] == "connected"
        assert "timestamp" in frame1

        # 2. Second frame: Initial state hydration
        frame2 = websocket.receive_json()
        assert frame2["event"] == "telemetry_update"
        assert "data" in frame2
        data = frame2["data"]
        assert data["tankLevel"] == 80.0
        assert data["pressure"] == 3.8

        # 3. Heartbeat test: Send string 'ping' -> expect 'pong'
        websocket.send_text("ping")
        pong_frame = websocket.receive_json()
        assert pong_frame["event"] == "pong"
        assert "timestamp" in pong_frame

        # 4. JSON Ping test: Send {"type": "ping"} -> expect 'pong'
        websocket.send_json({"type": "ping"})
        pong_frame2 = websocket.receive_json()
        assert pong_frame2["event"] == "pong"


def test_websocket_tank_specific_channel():
    """Verify tank-specific WebSocket stream and subscription."""
    client = TestClient(app)

    with client.websocket_connect("/api/v1/ws/sensors/1") as websocket:
        frame1 = websocket.receive_json()
        assert frame1["event"] == "connected"
        assert frame1["tank_id"] == 1

        websocket.send_text("ping")
        pong = websocket.receive_json()
        assert pong["event"] == "pong"
        assert pong["tank_id"] == 1


def test_connection_manager_diagnostics():
    """Verify ConnectionManager tracks stats cleanly."""
    stats = connection_manager.get_stats()
    assert "total_active_connections" in stats
    assert "tank_rooms_count" in stats
