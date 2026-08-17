from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tank import Tank
from app.repositories.base import BaseRepository


class TankRepository(BaseRepository[Tank]):
    """TankRepository handling database operations for Tank model."""

    def __init__(self, session: AsyncSession):
        super().__init__(Tank, session)

    async def get_by_name(self, name: str) -> Optional[Tank]:
        """Find tank by name."""
        stmt = select(Tank).where(Tank.name == name)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_status(self, status: str) -> List[Tank]:
        """Get list of tanks filtering by status."""
        stmt = select(Tank).where(Tank.status == status)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
