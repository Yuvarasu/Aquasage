from typing import Any, Dict, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tank_state import TankState
from app.repositories.base import BaseRepository


class TankStateRepository(BaseRepository[TankState]):
    """Repository handling singleton digital twin state operations per tank."""

    def __init__(self, session: AsyncSession):
        super().__init__(TankState, session)

    async def get_by_tank(self, tank_id: int) -> Optional[TankState]:
        """Retrieve the latest operational state for a specific tank."""
        result = await self.session.execute(
            select(TankState).where(TankState.tank_id == tank_id)
        )
        return result.scalars().first()

    async def upsert_state(self, tank_id: int, state_data: Dict[str, Any]) -> TankState:
        """Atomically insert or update the singleton state for a tank."""
        current_state = await self.get_by_tank(tank_id)
        if current_state:
            for field, value in state_data.items():
                if hasattr(current_state, field):
                    setattr(current_state, field, value)
            self.session.add(current_state)
            await self.session.flush()
            await self.session.refresh(current_state)
            return current_state
        else:
            state_data["tank_id"] = tank_id
            new_state = TankState(**state_data)
            self.session.add(new_state)
            await self.session.flush()
            await self.session.refresh(new_state)
            return new_state
