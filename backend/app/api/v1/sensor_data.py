from typing import List
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_sensor_data_service, require_roles
from app.core.roles import Role
from app.schemas.common import StandardResponse
from app.schemas.sensor_data import (
    FrontendTelemetryPayload,
    SensorDataIngest,
    SensorReadingResponse,
)
from app.services.sensor_data import SensorDataService

router = APIRouter(prefix="/sensor-data", tags=["IoT Sensor Data Ingestion"])


@router.post(
    "",
    response_model=StandardResponse[SensorReadingResponse],
    status_code=status.HTTP_201_CREATED,
)
async def ingest_sensor_data(
    data_in: SensorDataIngest,
    sensor_service: SensorDataService = Depends(get_sensor_data_service),
):
    """Ingest HC-SR04, YF-S201, and TDS sensor telemetry payload from ESP32 nodes."""
    reading = await sensor_service.ingest_sensor_data(data_in)
    return StandardResponse(
        success=True,
        message="Sensor telemetry ingested successfully",
        data=SensorReadingResponse.model_validate(reading),
    )


@router.get(
    "/latest",
    response_model=StandardResponse[FrontendTelemetryPayload],
)
async def get_latest_telemetry(
    sensor_service: SensorDataService = Depends(get_sensor_data_service),
):
    """Fetch latest platform telemetry payload matching frontend Zustand useTelemetryStore interface."""
    telemetry = await sensor_service.get_latest_telemetry()
    return StandardResponse(
        success=True,
        message="Latest telemetry retrieved successfully",
        data=telemetry,
    )


@router.get(
    "/history",
    response_model=StandardResponse[List[SensorReadingResponse]],
    dependencies=[Depends(get_current_user)],
)
async def get_sensor_history(
    limit: int = Query(100, ge=1, le=500),
    sensor_service: SensorDataService = Depends(get_sensor_data_service),
):
    """Fetch recent sensor data readings log."""
    readings = await sensor_service.get_history_by_tank(tank_id=1, limit=limit)
    return StandardResponse(
        success=True,
        message="Sensor readings history retrieved",
        data=readings,
    )


@router.get(
    "/tank/{tank_id}",
    response_model=StandardResponse[List[SensorReadingResponse]],
    dependencies=[Depends(get_current_user)],
)
async def get_sensor_data_by_tank(
    tank_id: int,
    limit: int = Query(100, ge=1, le=500),
    sensor_service: SensorDataService = Depends(get_sensor_data_service),
):
    """Fetch sensor data readings for a specific tank."""
    readings = await sensor_service.get_history_by_tank(tank_id=tank_id, limit=limit)
    return StandardResponse(
        success=True,
        message=f"Sensor readings for tank {tank_id} retrieved",
        data=readings,
    )
