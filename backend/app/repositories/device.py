from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.device import DeviceNode
from app.repositories.base import BaseRepository


class DeviceRepository(BaseRepository[DeviceNode]):
    """DeviceRepository handling operations for DeviceNode model."""

    def __init__(self, session: AsyncSession):
        super().__init__(DeviceNode, session)

    async def get_by_device_id(self, device_id: str) -> Optional[DeviceNode]:
        """Find device by hardware device_id string (e.g. ESP32_TANK_01)."""
        stmt = select(DeviceNode).where(DeviceNode.device_id == device_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_node_id(self, node_id: str) -> Optional[DeviceNode]:
        """Backward-compatible lookup by device_id."""
        return await self.get_by_device_id(node_id)

    async def get_by_name(self, device_name: str) -> Optional[DeviceNode]:
        """Find device by device_name string."""
        stmt = select(DeviceNode).where(DeviceNode.device_name == device_name)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_tank(self, tank_id: int) -> List[DeviceNode]:
        """Find all devices assigned to a specific tank."""
        stmt = select(DeviceNode).where(DeviceNode.tank_id == tank_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
