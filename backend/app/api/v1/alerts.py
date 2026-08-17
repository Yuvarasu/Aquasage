from typing import List
from fastapi import APIRouter, Depends, Query

from app.api.deps import get_alert_service, get_current_user
from app.schemas.alert import AlertResponse
from app.schemas.common import StandardResponse
from app.services.alert import AlertService

router = APIRouter(prefix="/alerts", tags=["SCADA Alert Engine"])


@router.get(
    "",
    response_model=StandardResponse[List[AlertResponse]],
)
async def list_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    alert_service: AlertService = Depends(get_alert_service),
):
    """Fetch active and historical SCADA alarms matching frontend SCADAAlarm interface."""
    alerts = await alert_service.get_alerts(skip=skip, limit=limit)
    return StandardResponse(
        success=True,
        message="Alerts retrieved successfully",
        data=alerts,
    )


@router.post(
    "/{alert_id}/acknowledge",
    response_model=StandardResponse[AlertResponse],
)
async def acknowledge_alert(
    alert_id: str,
    alert_service: AlertService = Depends(get_alert_service),
):
    """Acknowledge a SCADA alarm by ID (e.g. 'alm-1' or '1')."""
    ack_alert = await alert_service.acknowledge_alert(alert_id)
    return StandardResponse(
        success=True,
        message=f"Alert {alert_id} acknowledged successfully",
        data=ack_alert,
    )
