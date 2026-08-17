from typing import List
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_tank_service, require_roles
from app.core.roles import Role
from app.schemas.common import StandardResponse
from app.schemas.tank import TankCreate, TankResponse, TankUpdate
from app.services.tank import TankService

router = APIRouter(prefix="/tanks", tags=["Water Storage Tanks"])


@router.post(
    "",
    response_model=StandardResponse[TankResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([Role.ADMIN, Role.ENGINEER]))],
)
async def create_tank(
    tank_in: TankCreate,
    tank_service: TankService = Depends(get_tank_service),
):
    """Create a new water storage tank (Admin and Engineer)."""
    tank = await tank_service.create_tank(tank_in)
    return StandardResponse(
        success=True,
        message="Tank registered successfully",
        data=TankResponse.model_validate(tank),
    )


@router.get(
    "",
    response_model=StandardResponse[List[TankResponse]],
    dependencies=[Depends(get_current_user)],
)
async def list_tanks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    tank_service: TankService = Depends(get_tank_service),
):
    """Fetch all registered water storage tanks (Authenticated users)."""
    tanks = await tank_service.get_tanks(skip=skip, limit=limit)
    return StandardResponse(
        success=True,
        message="Tanks list retrieved successfully",
        data=[TankResponse.model_validate(t) for t in tanks],
    )


@router.get(
    "/{tank_id}",
    response_model=StandardResponse[TankResponse],
    dependencies=[Depends(get_current_user)],
)
async def get_tank_by_id(
    tank_id: int,
    tank_service: TankService = Depends(get_tank_service),
):
    """Fetch tank details by ID."""
    tank = await tank_service.get_tank(tank_id)
    return StandardResponse(
        success=True,
        message="Tank details retrieved successfully",
        data=TankResponse.model_validate(tank),
    )


@router.put(
    "/{tank_id}",
    response_model=StandardResponse[TankResponse],
    dependencies=[Depends(require_roles([Role.ADMIN, Role.ENGINEER, Role.OPERATOR]))],
)
async def update_tank(
    tank_id: int,
    tank_in: TankUpdate,
    tank_service: TankService = Depends(get_tank_service),
):
    """Update tank information (Admin, Engineer, Operator)."""
    updated_tank = await tank_service.update_tank(tank_id, tank_in)
    return StandardResponse(
        success=True,
        message="Tank updated successfully",
        data=TankResponse.model_validate(updated_tank),
    )


@router.delete(
    "/{tank_id}",
    response_model=StandardResponse[TankResponse],
    dependencies=[Depends(require_roles([Role.ADMIN]))],
)
async def delete_tank(
    tank_id: int,
    tank_service: TankService = Depends(get_tank_service),
):
    """Delete a water storage tank (Admin only)."""
    deleted_tank = await tank_service.delete_tank(tank_id)
    return StandardResponse(
        success=True,
        message="Tank deleted successfully",
        data=TankResponse.model_validate(deleted_tank),
    )
