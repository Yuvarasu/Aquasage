from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import SCADAAlarmModel
from app.repositories.base import BaseRepository


class AlertRepository(BaseRepository[SCADAAlarmModel]):
    """AlertRepository for SCADA alerts and notification logs."""

    def __init__(self, session: AsyncSession):
        super().__init__(SCADAAlarmModel, session)

    async def get_active_alarms(self) -> List[SCADAAlarmModel]:
        """Fetch all unacknowledged SCADA alarms."""
        stmt = select(SCADAAlarmModel).where(SCADAAlarmModel.acknowledged == False).order_by(SCADAAlarmModel.id.desc())
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
