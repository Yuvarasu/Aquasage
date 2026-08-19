from datetime import datetime, timezone
from typing import List, Optional
from app.core.config import settings
from app.core.exceptions import NotFoundException
from app.models.alert import SCADAAlarmModel
from app.repositories.alert import AlertRepository
from app.schemas.alert import AlertCreate, AlertResponse
from app.websocket.manager import connection_manager


class AlertService:
    """Service handling SCADA alerts, deduplication, cooldown, and real-time distribution."""

    def __init__(self, alert_repo: AlertRepository):
        self.alert_repo = alert_repo

    async def create_alert(self, alert_in: AlertCreate) -> SCADAAlarmModel:
        """Create new SCADA alert with deduplication and real-time broadcast."""
        return await self.create_or_deduplicate_alert(alert_in)

    async def create_or_deduplicate_alert(self, alert_in: AlertCreate) -> SCADAAlarmModel:
        """Create a new alert or refresh an existing unacknowledged alert to prevent spam duplicates."""
        existing = await self.alert_repo.get_active_alert_by_code(
            tank_id=alert_in.tank_id, alarm_code=alert_in.alarm_code
        )

        now_utc = datetime.now(timezone.utc)

        if existing:
            # Refresh timestamp and message on active alert
            existing.timestamp = now_utc
            existing.message = alert_in.message
            existing.severity = alert_in.severity
            await self.alert_repo.update(
                existing,
                {
                    "timestamp": now_utc,
                    "message": alert_in.message,
                    "severity": alert_in.severity,
                },
            )
            return existing

        # Create fresh alert
        alert = await self.alert_repo.create(alert_in)

        # Broadcast live alert to connected WebSocket subscribers
        alert_payload = AlertResponse(
            id=f"alm-{alert.id}",
            tank_id=alert.tank_id,
            alarm_code=alert.alarm_code,
            type=alert.type,
            timestamp=now_utc.isoformat(),
            title=alert.title,
            message=alert.message,
            severity=alert.severity,
            source_node=alert.source_node,
            sourceNode=alert.source_node,
            acknowledged=False,
        )

        await connection_manager.broadcast_all(
            {
                "event": "alert_created",
                "data": alert_payload.model_dump(),
            }
        )

        return alert

    async def get_alerts(
        self,
        skip: int = 0,
        limit: int = 100,
        acknowledged: Optional[bool] = None,
        severity: Optional[str] = None,
        tank_id: Optional[int] = None,
        alert_type: Optional[str] = None,
    ) -> List[AlertResponse]:
        """Fetch alerts with multi-parameter filtering mapped to frontend SCADAAlarm format."""
        alarms = await self.alert_repo.get_filtered_alerts(
            skip=skip,
            limit=limit,
            acknowledged=acknowledged,
            severity=severity,
            tank_id=tank_id,
            alert_type=alert_type,
        )
        return [
            AlertResponse(
                id=f"alm-{a.id}",
                tank_id=a.tank_id,
                alarm_code=a.alarm_code,
                type=a.type,
                timestamp=a.timestamp.strftime("%I:%M:%S %p") if a.timestamp else datetime.now(timezone.utc).isoformat(),
                title=a.title,
                message=a.message,
                severity=a.severity,
                source_node=a.source_node,
                sourceNode=a.source_node,
                acknowledged=a.acknowledged,
            )
            for a in alarms
        ]

    async def acknowledge_alert(self, alert_id_str: str) -> AlertResponse:
        """Acknowledge alert by string ID e.g. 'alm-1' or '1'."""
        numeric_id = int(str(alert_id_str).replace("alm-", ""))
        alarm = await self.alert_repo.acknowledge(numeric_id)
        if not alarm:
            raise NotFoundException(f"Alert with ID {alert_id_str} not found")
        return AlertResponse(
            id=f"alm-{alarm.id}",
            tank_id=alarm.tank_id,
            alarm_code=alarm.alarm_code,
            type=alarm.type,
            timestamp=alarm.timestamp.strftime("%I:%M:%S %p") if alarm.timestamp else datetime.now(timezone.utc).isoformat(),
            title=alarm.title,
            message=alarm.message,
            severity=alarm.severity,
            source_node=alarm.source_node,
            sourceNode=alarm.source_node,
            acknowledged=alarm.acknowledged,
        )

    async def acknowledge_all_alerts(self, tank_id: Optional[int] = None) -> int:
        """Bulk-acknowledge all active alerts, optionally filtered by tank_id."""
        return await self.alert_repo.acknowledge_all(tank_id=tank_id)

    async def evaluate_prototype_telemetry(
        self,
        tank_id: int,
        water_level_pct: float,
        flow_difference_lpm: float,
        possible_leak: bool,
        tds_ppm: float,
        turbidity_raw: int,
        source_node: str = "ESP32_TANK_01",
    ) -> List[SCADAAlarmModel]:
        """Evaluate benchtop prototype telemetry and trigger alerts with deduplication."""
        created_alerts: List[SCADAAlarmModel] = []

        # 1. Critical Low Water Level Alert
        if water_level_pct < 20.0:
            alert = await self.create_or_deduplicate_alert(
                AlertCreate(
                    tank_id=tank_id,
                    alarm_code="LOW_WATER_LEVEL",
                    type="Low Tank Level",
                    title="Critical Low Water Level",
                    message=f"Tank water level dropped to {water_level_pct:.1f}% (<20% threshold).",
                    severity="critical" if water_level_pct < 10.0 else "warning",
                    source_node=source_node,
                )
            )
            created_alerts.append(alert)

        # 2. Differential Flow Leak Alert
        if possible_leak:
            alert = await self.create_or_deduplicate_alert(
                AlertCreate(
                    tank_id=tank_id,
                    alarm_code="LEAK_DETECTED",
                    type="Potential Leak",
                    title="Differential Flow Leak Detected",
                    message=f"Abnormal water loss detected between Flow 1 and Flow 2 ({flow_difference_lpm:.2f} L/min).",
                    severity="critical",
                    source_node=source_node,
                )
            )
            created_alerts.append(alert)

        # 3. High TDS Alert
        if tds_ppm > settings.TDS_THRESHOLD_MONITOR_PPM:
            alert = await self.create_or_deduplicate_alert(
                AlertCreate(
                    tank_id=tank_id,
                    alarm_code="HIGH_TDS",
                    type="High TDS",
                    title="High Dissolved Solids Indicator",
                    message=f"TDS reading ({tds_ppm:.1f} PPM) exceeded monitor threshold ({settings.TDS_THRESHOLD_MONITOR_PPM} PPM).",
                    severity="warning",
                    source_node=source_node,
                )
            )
            created_alerts.append(alert)

        # 4. High Turbidity Alert
        if turbidity_raw > settings.TURBIDITY_THRESHOLD_MODERATE_RAW:
            alert = await self.create_or_deduplicate_alert(
                AlertCreate(
                    tank_id=tank_id,
                    alarm_code="HIGH_TURBIDITY",
                    type="High Turbidity",
                    title="Water Turbidity Clarity Alert",
                    message=f"Turbidity ADC value ({turbidity_raw}) exceeded clarity threshold ({settings.TURBIDITY_THRESHOLD_MODERATE_RAW}).",
                    severity="warning",
                    source_node=source_node,
                )
            )
            created_alerts.append(alert)

        return created_alerts

    async def evaluate_sensor_data(
        self,
        water_level_pct: float,
        tds_ppm: float,
        ph_level: float = 7.2,
        leak_probability: float = 0.0,
        node_name: str = "ESP32_TANK_01",
    ) -> Optional[SCADAAlarmModel]:
        """Backward-compatible evaluation helper."""
        alerts = await self.evaluate_prototype_telemetry(
            tank_id=1,
            water_level_pct=water_level_pct,
            flow_difference_lpm=1.0 if leak_probability > 0.5 else 0.0,
            possible_leak=leak_probability > 0.5,
            tds_ppm=tds_ppm,
            turbidity_raw=1000,
            source_node=node_name,
        )
        return alerts[0] if alerts else None
