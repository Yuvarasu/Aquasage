import json
from typing import Dict, List, Set
from fastapi import WebSocket
from app.core.logging import logger


class ConnectionManager:
    """Manages active WebSocket connections and channel subscriptions for real-time sensor streaming."""

    def __init__(self):
        # Global active connections
        self.active_connections: Set[WebSocket] = set()
        # Tank specific room subscriptions: tank_id -> Set[WebSocket]
        self.tank_rooms: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, tank_id: int | None = None):
        """Accept new WebSocket connection and optionally join a tank streaming channel."""
        await websocket.accept()
        self.active_connections.add(websocket)
        
        if tank_id is not None:
            if tank_id not in self.tank_rooms:
                self.tank_rooms[tank_id] = set()
            self.tank_rooms[tank_id].add(websocket)

        logger.info(f"WebSocket connected. Total active: {len(self.active_connections)}, Tank room {tank_id}")

    def disconnect(self, websocket: WebSocket, tank_id: int | None = None):
        """Remove WebSocket connection from active pools."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        if tank_id is not None and tank_id in self.tank_rooms:
            if websocket in self.tank_rooms[tank_id]:
                self.tank_rooms[tank_id].remove(websocket)
            if not self.tank_rooms[tank_id]:
                del self.tank_rooms[tank_id]

        logger.info(f"WebSocket disconnected. Remaining active: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send JSON payload directly to a specific connected client."""
        await websocket.send_text(json.dumps(message))

    async def broadcast_to_tank(self, tank_id: int, message: dict):
        """Broadcast sensor telemetry data to all subscribers listening to a specific tank."""
        if tank_id in self.tank_rooms:
            disconnected = []
            payload = json.dumps(message)
            for connection in self.tank_rooms[tank_id]:
                try:
                    await connection.send_text(payload)
                except Exception as e:
                    logger.warning(f"Error broadcasting to WS connection: {e}")
                    disconnected.append(connection)

            for conn in disconnected:
                self.disconnect(conn, tank_id=tank_id)

    async def broadcast_all(self, message: dict):
        """Broadcast event notification to all connected clients platform-wide."""
        disconnected = []
        payload = json.dumps(message)
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error broadcasting to global WS connection: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)


connection_manager = ConnectionManager()
