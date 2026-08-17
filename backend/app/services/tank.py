from typing import List
from app.core.exceptions import DuplicateEntityException, NotFoundException
from app.models.tank import Tank
from app.repositories.tank import TankRepository
from app.schemas.tank import TankCreate, TankUpdate


class TankService:
    """Service layer executing business logic for Water Storage Tanks."""

    def __init__(self, tank_repo: TankRepository):
        self.tank_repo = tank_repo

    async def create_tank(self, tank_in: TankCreate) -> Tank:
        """Create new water storage tank."""
        existing = await self.tank_repo.get_by_name(tank_in.name)
        if existing:
            raise DuplicateEntityException(f"Tank with name '{tank_in.name}' already exists")
        return await self.tank_repo.create(tank_in)

    async def get_tank(self, tank_id: int) -> Tank:
        """Get tank by ID or raise NotFoundException."""
        tank = await self.tank_repo.get(tank_id)
        if not tank:
            raise NotFoundException(f"Tank with ID {tank_id} not found")
        return tank

    async def get_tanks(self, skip: int = 0, limit: int = 100) -> List[Tank]:
        """Fetch list of tanks with pagination."""
        return await self.tank_repo.get_multi(skip=skip, limit=limit)

    async def update_tank(self, tank_id: int, tank_in: TankUpdate) -> Tank:
        """Update existing tank details."""
        tank = await self.get_tank(tank_id)
        if tank_in.name and tank_in.name != tank.name:
            existing = await self.tank_repo.get_by_name(tank_in.name)
            if existing:
                raise DuplicateEntityException(f"Tank with name '{tank_in.name}' already exists")
        return await self.tank_repo.update(tank, tank_in)

    async def delete_tank(self, tank_id: int) -> Tank:
        """Delete tank record."""
        tank = await self.get_tank(tank_id)
        await self.tank_repo.delete(tank_id)
        return tank
