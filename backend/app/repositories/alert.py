from typing import List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import SCADAAlarmModel
from app.repositories.base import BaseRepository


class AlertRepository(BaseRepository[SCADAAlarmModel]):
    """AlertRepository for SCADA alerts and notification logs."""

    def __init__(self, session: AsyncSession):
        super().__init__(SCADAAlarmModel, session)

    async def get_active_alarms(self) -> List[SCADAAlarmModel]:
        """Fetch all unacknowledged alarms."""
        stmt = (
            select(SCADAAlarmModel)
            .where(SCADAAlarmModel.acknowledged == False)
            .order_by(SCADAAlarmModel.id.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_active_alert_by_code(
        self, tank_id: Optional[int], alarm_code: str
    ) -> Optional[SCADAAlarmModel]:
        """Find an existing active (unacknowledged) alert with the same code on this tank."""
        stmt = (
            select(SCADAAlarmModel)
            .where(
                SCADAAlarmModel.acknowledged == False,
                SCADAAlarmModel.alarm_code == alarm_code,
            )
        )
        if tank_id is not None:
            stmt = stmt.where(SCADAAlarmModel.tank_id == tank_id)
        stmt = stmt.order_by(SCADAAlarmModel.id.desc()).limit(1)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_filtered_alerts(
        self,
        skip: int = 0,
        limit: int = 100,
        acknowledged: Optional[bool] = None,
        severity: Optional[str] = None,
        tank_id: Optional[int] = None,
        alert_type: Optional[str] = None,
    ) -> List[SCADAAlarmModel]:
        """Query alerts with flexible multi-parameter filtering."""
        stmt = select(SCADAAlarmModel)

        if acknowledged is not None:
            stmt = stmt.where(SCADAAlarmModel.acknowledged == acknowledged)
        if severity is not None:
            stmt = stmt.where(SCADAAlarmModel.severity == severity.lower())
        if tank_id is not None:
            stmt = stmt.where(SCADAAlarmModel.tank_id == tank_id)
        if alert_type is not None:
            stmt = stmt.where(SCADAAlarmModel.type == alert_type)

        stmt = stmt.order_by(SCADAAlarmModel.id.desc()).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def acknowledge(self, alert_id: int) -> Optional[SCADAAlarmModel]:
        """Mark an alarm as acknowledged by ID."""
        alarm = await self.get(alert_id)
        if alarm:
            alarm.acknowledged = True
            self.session.add(alarm)
            await self.session.flush()
            await self.session.refresh(alarm)
        return alarm

    async def acknowledge_all(self, tank_id: Optional[int] = None) -> int:
        """Bulk-acknowledge all active alarms, optionally filtered by tank_id."""
        stmt = (
            update(SCADAAlarmModel)
            .where(SCADAAlarmModel.acknowledged == False)
            .values(acknowledged=True)
        )
        if tank_id is not None:
            stmt = stmt.where(SCADAAlarmModel.tank_id == tank_id)

        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount
