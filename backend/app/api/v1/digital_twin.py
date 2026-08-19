from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, get_digital_twin_service
from app.schemas.common import StandardResponse
from app.schemas.digital_twin import DigitalTwinStateResponse
from app.services.digital_twin import DigitalTwinService

router = APIRouter(prefix="/digital-twin", tags=["Digital Twin Engine"])


@router.get(
    "/{tank_id}",
    response_model=StandardResponse[DigitalTwinStateResponse],
)
async def get_digital_twin(
    tank_id: int,
    digital_twin_service: DigitalTwinService = Depends(get_digital_twin_service),
):
    """GET /api/v1/digital-twin/{tank_id} - Retrieve live virtual digital twin model of a water storage tank."""
    twin = await digital_twin_service.get_digital_twin_state(tank_id)
    return StandardResponse(
        success=True,
        message=f"Digital Twin state for Tank {tank_id} retrieved successfully",
        data=twin,
    )
