import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.logging import logger
from app.websocket.manager import connection_manager

router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws")
async def websocket_telemetry_stream(websocket: WebSocket):
    """Global WebSocket endpoint for real-time telemetry streaming matching frontend socketService.ts."""
    await connection_manager.connect(websocket)
    try:
        # Initial greeting payload
        await connection_manager.send_personal_message(
            {
                "event": "connected",
                "message": "Connected to AquaSage SCADA Live Telemetry Stream",
            },
            websocket,
        )
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received WS message: {data}")
            # Echo back acknowledgement
            await connection_manager.send_personal_message(
                {"event": "ack", "received": data}, websocket
            )
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
        logger.info("WebSocket telemetry client disconnected")
    except Exception as e:
        logger.error(f"WebSocket exception: {e}")
        connection_manager.disconnect(websocket)


@router.websocket("/api/v1/ws/sensors/{tank_id}")
async def websocket_tank_stream(websocket: WebSocket, tank_id: int):
    """Tank-specific WebSocket telemetry stream."""
    await connection_manager.connect(websocket, tank_id=tank_id)
    try:
        await connection_manager.send_personal_message(
            {
                "event": "connected",
                "message": f"Subscribed to real-time stream for Tank {tank_id}",
            },
            websocket,
        )
        while True:
            data = await websocket.receive_text()
            await connection_manager.send_personal_message(
                {"event": "ack", "received": data}, websocket
            )
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, tank_id=tank_id)
