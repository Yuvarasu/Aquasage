import json
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.logging import logger
from app.websocket.manager import connection_manager

router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws")
@router.websocket("/api/v1/ws")
async def websocket_telemetry_stream(websocket: WebSocket):
    """Global WebSocket endpoint for real-time telemetry streaming matching frontend socketService.ts."""
    await connection_manager.connect(websocket)
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        # 1. Initial greeting payload
        await connection_manager.send_personal_message(
            {
                "event": "connected",
                "message": "Connected to AquaSage SCADA Live Telemetry Stream",
                "timestamp": now_iso,
            },
            websocket,
        )

        # 2. Initial state hydration payload
        await connection_manager.send_personal_message(
            {
                "event": "telemetry_update",
                "data": {
                    "timestamp": now_iso,
                    "pressure": 3.8,
                    "flowRate": 0.0,
                    "tankLevel": 80.0,
                    "tankCapacityLiters": 20.0,
                    "pumpStatus": "stopped",
                    "pumpRPM": 0,
                    "dailyConsumptionLiters": 0.0,
                    "hourlyConsumptionLiters": 0.0,
                    "leakProbability": 0.0,
                    "pumpHealthScore": 100,
                    "valveStatus": "CLOSED",
                    "waterTurbidityNTU": 0.4,
                    "pHLevel": 7.2,
                    "flow_1_lpm": 0.0,
                    "flow_2_lpm": 0.0,
                    "water_loss_lpm": 0.0,
                    "tds_ppm": 120.0,
                    "turbidity_raw": 1000,
                    "turbidity_status": "Clear",
                    "water_quality_status": "Good",
                },
            },
            websocket,
        )

        while True:
            raw_text = await websocket.receive_text()
            try:
                msg_json = json.loads(raw_text)
                msg_type = msg_json.get("type", "").lower()
            except Exception:
                msg_type = raw_text.strip().lower()

            # Heartbeat keep-alive ping/pong
            if msg_type in ("ping", "heartbeat"):
                await connection_manager.send_personal_message(
                    {
                        "event": "pong",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                    websocket,
                )
            else:
                await connection_manager.send_personal_message(
                    {"event": "ack", "received": raw_text}, websocket
                )
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
        logger.info("WebSocket telemetry client disconnected")
    except Exception as e:
        logger.error(f"WebSocket exception: {e}")
        connection_manager.disconnect(websocket)


@router.websocket("/api/v1/ws/sensors/{tank_id}")
@router.websocket("/ws/tanks/{tank_id}")
async def websocket_tank_stream(websocket: WebSocket, tank_id: int):
    """Tank-specific WebSocket telemetry stream."""
    await connection_manager.connect(websocket, tank_id=tank_id)
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        await connection_manager.send_personal_message(
            {
                "event": "connected",
                "message": f"Subscribed to real-time stream for Tank {tank_id}",
                "tank_id": tank_id,
                "timestamp": now_iso,
            },
            websocket,
        )
        while True:
            raw_text = await websocket.receive_text()
            try:
                msg_json = json.loads(raw_text)
                msg_type = msg_json.get("type", "").lower()
            except Exception:
                msg_type = raw_text.strip().lower()

            if msg_type in ("ping", "heartbeat"):
                await connection_manager.send_personal_message(
                    {
                        "event": "pong",
                        "tank_id": tank_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                    websocket,
                )
            else:
                await connection_manager.send_personal_message(
                    {"event": "ack", "received": raw_text}, websocket
                )
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, tank_id=tank_id)
