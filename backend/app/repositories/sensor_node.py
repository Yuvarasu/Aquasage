from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sensor_node import SensorNode
from app.repositories.base import BaseRepository


class SensorNodeRepository(BaseRepository[SensorNode]):
    """SensorNodeRepository handling database operations for SensorNode model."""

    def __init__(self, session: AsyncSession):
        super().__init__(SensorNode, session)

    async def get_by_tank(self, tank_id: int) -> List[SensorNode]:
        """Fetch all sensor nodes associated with a specific tank."""
        stmt = select(SensorNode).where(SensorNode.tank_id == tank_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_name(self, node_name: str) -> Optional[SensorNode]:
        """Find sensor node by node name."""
        stmt = select(SensorNode).where(SensorNode.node_name == node_name)
        result = await self.session.execute(stmt)
        return result.scalars().first()
