from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_alert_service
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
    acknowledged: Optional[bool] = Query(None, description="Filter by acknowledgment status (true/false)"),
    severity: Optional[str] = Query(None, description="Filter by severity (critical, warning, info)"),
    tank_id: Optional[int] = Query(None, description="Filter by tank ID"),
    type: Optional[str] = Query(None, description="Filter by alert type"),
    alert_service: AlertService = Depends(get_alert_service),
):
    """Fetch active and historical alarms with multi-parameter filtering."""
    alerts = await alert_service.get_alerts(
        skip=skip,
        limit=limit,
        acknowledged=acknowledged,
        severity=severity,
        tank_id=tank_id,
        alert_type=type,
    )
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


@router.post(
    "/acknowledge-all",
    response_model=StandardResponse[dict],
)
async def acknowledge_all_alerts(
    tank_id: Optional[int] = Query(None, description="Optional tank ID to filter bulk acknowledgment"),
    alert_service: AlertService = Depends(get_alert_service),
):
    """Bulk-acknowledge all active alarms."""
    count = await alert_service.acknowledge_all_alerts(tank_id=tank_id)
    return StandardResponse(
        success=True,
        message=f"Acknowledged {count} active alerts successfully",
        data={"acknowledged_count": count},
    )
