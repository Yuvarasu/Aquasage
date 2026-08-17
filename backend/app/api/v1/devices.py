from typing import List
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_device_service, require_roles
from app.core.roles import Role
from app.schemas.common import StandardResponse
from app.schemas.device import DeviceRegister, DeviceResponse, DeviceUpdate
from app.services.device import DeviceService

router = APIRouter(prefix="/devices", tags=["IoT Devices Management"])


@router.post(
    "/register",
    response_model=StandardResponse[DeviceResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([Role.ADMIN, Role.ENGINEER]))],
)
async def register_device(
    device_in: DeviceRegister,
    device_service: DeviceService = Depends(get_device_service),
):
    """Register a new IoT Sensor Node / Gateway device."""
    device = await device_service.register_device(device_in)
    return StandardResponse(
        success=True,
        message="Device registered successfully",
        data=DeviceResponse.model_validate(device),
    )


@router.get(
    "",
    response_model=StandardResponse[List[DeviceResponse]],
    dependencies=[Depends(get_current_user)],
)
async def list_devices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    device_service: DeviceService = Depends(get_device_service),
):
    """List all registered IoT Sensor Nodes."""
    devices = await device_service.get_devices(skip=skip, limit=limit)
    return StandardResponse(
        success=True,
        message="Devices list retrieved successfully",
        data=[DeviceResponse.model_validate(d) for d in devices],
    )


@router.get(
    "/{device_id}",
    response_model=StandardResponse[DeviceResponse],
    dependencies=[Depends(get_current_user)],
)
async def get_device_by_id(
    device_id: int,
    device_service: DeviceService = Depends(get_device_service),
):
    """Fetch device details by ID."""
    device = await device_service.get_device(device_id)
    return StandardResponse(
        success=True,
        message="Device details retrieved successfully",
        data=DeviceResponse.model_validate(device),
    )


@router.patch(
    "/{device_id}",
    response_model=StandardResponse[DeviceResponse],
    dependencies=[Depends(require_roles([Role.ADMIN, Role.ENGINEER]))],
)
async def update_device(
    device_id: int,
    device_in: DeviceUpdate,
    device_service: DeviceService = Depends(get_device_service),
):
    """Update device metadata, location, or firmware version."""
    device = await device_service.update_device(device_id, device_in)
    return StandardResponse(
        success=True,
        message="Device updated successfully",
        data=DeviceResponse.model_validate(device),
    )
