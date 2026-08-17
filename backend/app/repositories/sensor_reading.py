from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sensor_reading import SensorReading
from app.repositories.base import BaseRepository


class SensorReadingRepository(BaseRepository[SensorReading]):
    """SensorReadingRepository handling database queries for IoT telemetry readings."""

    def __init__(self, session: AsyncSession):
        super().__init__(SensorReading, session)

    async def get_latest(self) -> Optional[SensorReading]:
        """Fetch latest ingested sensor reading."""
        stmt = select(SensorReading).order_by(SensorReading.id.desc()).limit(1)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_latest_by_tank(self, tank_id: int) -> Optional[SensorReading]:
        """Fetch latest sensor reading for a specific tank."""
        stmt = select(SensorReading).where(SensorReading.tank_id == tank_id).order_by(SensorReading.id.desc()).limit(1)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_history_by_tank(self, tank_id: int, limit: int = 100) -> List[SensorReading]:
        """Fetch historical sensor readings for a tank."""
        stmt = select(SensorReading).where(SensorReading.tank_id == tank_id).order_by(SensorReading.id.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
