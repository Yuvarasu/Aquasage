from typing import List
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_sensor_node_service, require_roles
from app.core.roles import Role
from app.schemas.common import StandardResponse
from app.schemas.sensor_node import (
    SensorNodeCreate,
    SensorNodeResponse,
    SensorNodeUpdate,
)
from app.services.sensor_node import SensorNodeService

router = APIRouter(prefix="/sensor-nodes", tags=["IoT Sensor Nodes"])


@router.post(
    "",
    response_model=StandardResponse[SensorNodeResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([Role.ADMIN, Role.ENGINEER]))],
)
async def create_sensor_node(
    node_in: SensorNodeCreate,
    sensor_service: SensorNodeService = Depends(get_sensor_node_service),
):
    """Register a new ESP32 IoT sensor node (Admin and Engineer)."""
    node = await sensor_service.create_sensor_node(node_in)
    return StandardResponse(
        success=True,
        message="Sensor node registered successfully",
        data=SensorNodeResponse.model_validate(node),
    )


@router.get(
    "",
    response_model=StandardResponse[List[SensorNodeResponse]],
    dependencies=[Depends(get_current_user)],
)
async def list_sensor_nodes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    sensor_service: SensorNodeService = Depends(get_sensor_node_service),
):
    """Fetch all registered IoT sensor nodes."""
    nodes = await sensor_service.get_sensor_nodes(skip=skip, limit=limit)
    return StandardResponse(
        success=True,
        message="Sensor nodes list retrieved successfully",
        data=[SensorNodeResponse.model_validate(n) for n in nodes],
    )


@router.get(
    "/tank/{tank_id}",
    response_model=StandardResponse[List[SensorNodeResponse]],
    dependencies=[Depends(get_current_user)],
)
async def list_sensor_nodes_by_tank(
    tank_id: int,
    sensor_service: SensorNodeService = Depends(get_sensor_node_service),
):
    """Fetch all sensor nodes associated with a specific tank."""
    nodes = await sensor_service.get_sensor_nodes_by_tank(tank_id)
    return StandardResponse(
        success=True,
        message=f"Sensor nodes for tank {tank_id} retrieved successfully",
        data=[SensorNodeResponse.model_validate(n) for n in nodes],
    )


@router.get(
    "/{node_id}",
    response_model=StandardResponse[SensorNodeResponse],
    dependencies=[Depends(get_current_user)],
)
async def get_sensor_node_by_id(
    node_id: int,
    sensor_service: SensorNodeService = Depends(get_sensor_node_service),
):
    """Fetch sensor node details by ID."""
    node = await sensor_service.get_sensor_node(node_id)
    return StandardResponse(
        success=True,
        message="Sensor node details retrieved successfully",
        data=SensorNodeResponse.model_validate(node),
    )


@router.put(
    "/{node_id}",
    response_model=StandardResponse[SensorNodeResponse],
    dependencies=[Depends(require_roles([Role.ADMIN, Role.ENGINEER]))],
)
async def update_sensor_node(
    node_id: int,
    node_in: SensorNodeUpdate,
    sensor_service: SensorNodeService = Depends(get_sensor_node_service),
):
    """Update sensor node configuration or status."""
    node = await sensor_service.update_sensor_node(node_id, node_in)
    return StandardResponse(
        success=True,
        message="Sensor node updated successfully",
        data=SensorNodeResponse.model_validate(node),
    )


@router.delete(
    "/{node_id}",
    response_model=StandardResponse[SensorNodeResponse],
    dependencies=[Depends(require_roles([Role.ADMIN]))],
)
async def delete_sensor_node(
    node_id: int,
    sensor_service: SensorNodeService = Depends(get_sensor_node_service),
):
    """Delete a sensor node registration."""
    node = await sensor_service.delete_sensor_node(node_id)
    return StandardResponse(
        success=True,
        message="Sensor node deleted successfully",
        data=SensorNodeResponse.model_validate(node),
    )
