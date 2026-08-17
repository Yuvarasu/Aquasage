from fastapi import APIRouter

from app.api.v1 import (
    alerts,
    analytics,
    auth,
    devices,
    digital_twin,
    health,
    sensor_data,
    sensor_nodes,
    system,
    tanks,
    users,
    websocket,
)

api_v1_router = APIRouter()

api_v1_router.include_router(health.router)
api_v1_router.include_router(system.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(users.router)
api_v1_router.include_router(tanks.router)
api_v1_router.include_router(sensor_nodes.router)
api_v1_router.include_router(devices.router)
api_v1_router.include_router(sensor_data.router)
api_v1_router.include_router(digital_twin.router)
api_v1_router.include_router(alerts.router)
api_v1_router.include_router(analytics.router)
api_v1_router.include_router(websocket.router)
