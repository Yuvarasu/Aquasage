from datetime import datetime, timezone
from typing import List, Optional
from app.core.exceptions import NotFoundException
from app.models.alert import SCADAAlarmModel
from app.repositories.alert import AlertRepository
from app.schemas.alert import AlertCreate, AlertResponse


class AlertService:
    """Service handling SCADA alerts and automated alert evaluation."""

    def __init__(self, alert_repo: AlertRepository):
        self.alert_repo = alert_repo

    async def create_alert(self, alert_in: AlertCreate) -> SCADAAlarmModel:
        """Create new SCADA alert."""
        return await self.alert_repo.create(alert_in)

    async def get_alerts(self, skip: int = 0, limit: int = 100) -> List[AlertResponse]:
        """Fetch all alerts mapped to frontend SCADAAlarm format."""
        alarms = await self.alert_repo.get_multi(skip=skip, limit=limit)
        return [
            AlertResponse(
                id=f"alm-{a.id}",
                timestamp=a.timestamp.strftime("%I:%M:%S %p"),
                title=a.title,
                message=a.message,
                severity=a.severity,
                sourceNode=a.source_node,
                acknowledged=a.acknowledged,
            )
            for a in alarms
        ]

    async def acknowledge_alert(self, alert_id_str: str) -> AlertResponse:
        """Acknowledge alert by string ID e.g. 'alm-1' or '1'."""
        numeric_id = int(alert_id_str.replace("alm-", ""))
        alarm = await self.alert_repo.acknowledge(numeric_id)
        if not alarm:
            raise NotFoundException(f"Alert with ID {alert_id_str} not found")
        return AlertResponse(
            id=f"alm-{alarm.id}",
            timestamp=alarm.timestamp.strftime("%I:%M:%S %p"),
            title=alarm.title,
            message=alarm.message,
            severity=alarm.severity,
            sourceNode=alarm.source_node,
            acknowledged=alarm.acknowledged,
        )

    async def evaluate_sensor_data(
        self,
        water_level_pct: float,
        tds_ppm: float,
        ph_level: float,
        leak_probability: float,
        node_name: str = "PRESSURE_SEN_01",
    ) -> Optional[SCADAAlarmModel]:
        """Evaluate sensor metrics and trigger SCADA alerts automatically if thresholds are breached."""
        # 1. Low Water Level Alarm
        if water_level_pct < 20.0:
            return await self.create_alert(
                AlertCreate(
                    alarm_code="LOW_WATER_LEVEL",
                    title="Critical Low Storage",
                    message=f"Water storage level dropped below threshold ({water_level_pct:.1f}%).",
                    severity="critical",
                    source_node="VILLAGE_TANK",
                )
            )

        # 2. Unsafe Water Quality Alarm
        if tds_ppm > 500.0 or ph_level < 6.5 or ph_level > 8.5:
            return await self.create_alert(
                AlertCreate(
                    alarm_code="UNSAFE_WATER_QUALITY",
                    title="Water Contamination Alert",
                    message=f"TDS level ({tds_ppm:.1f} PPM) or pH ({ph_level:.1f}) out of safe bounds.",
                    severity="warning",
                    source_node="RESERVOIR",
                )
            )

        # 3. High Leak Probability Alarm
        if leak_probability > 0.5:
            return await self.create_alert(
                AlertCreate(
                    alarm_code="LEAK_DETECTION",
                    title="Micro-Leak Detected",
                    message=f"Pressure drop anomaly detected. Leak index at {(leak_probability * 100):.1f}%.",
                    severity="warning",
                    source_node=node_name,
                )
            )

        return None
