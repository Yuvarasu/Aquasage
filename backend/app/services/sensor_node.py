from typing import List
from app.core.exceptions import DuplicateEntityException, NotFoundException
from app.models.sensor_node import SensorNode
from app.repositories.sensor_node import SensorNodeRepository
from app.repositories.tank import TankRepository
from app.schemas.sensor_node import SensorNodeCreate, SensorNodeUpdate


class SensorNodeService:
    """Service layer executing business logic for IoT Sensor Nodes."""

    def __init__(self, sensor_repo: SensorNodeRepository, tank_repo: TankRepository):
        self.sensor_repo = sensor_repo
        self.tank_repo = tank_repo

    async def create_sensor_node(self, node_in: SensorNodeCreate) -> SensorNode:
        """Create new sensor node associated with a tank."""
        tank = await self.tank_repo.get(node_in.tank_id)
        if not tank:
            raise NotFoundException(f"Associated Tank with ID {node_in.tank_id} does not exist")

        existing = await self.sensor_repo.get_by_name(node_in.node_name)
        if existing:
            raise DuplicateEntityException(f"Sensor node '{node_in.node_name}' already exists")

        return await self.sensor_repo.create(node_in)

    async def get_sensor_node(self, node_id: int) -> SensorNode:
        """Get sensor node by ID or raise NotFoundException."""
        node = await self.sensor_repo.get(node_id)
        if not node:
            raise NotFoundException(f"Sensor node with ID {node_id} not found")
        return node

    async def get_sensor_nodes_by_tank(self, tank_id: int) -> List[SensorNode]:
        """Fetch all sensor nodes attached to a tank."""
        tank = await self.tank_repo.get(tank_id)
        if not tank:
            raise NotFoundException(f"Tank with ID {tank_id} not found")
        return await self.sensor_repo.get_by_tank(tank_id)

    async def get_sensor_nodes(self, skip: int = 0, limit: int = 100) -> List[SensorNode]:
        """Fetch list of sensor nodes with pagination."""
        return await self.sensor_repo.get_multi(skip=skip, limit=limit)

    async def update_sensor_node(self, node_id: int, node_in: SensorNodeUpdate) -> SensorNode:
        """Update existing sensor node details."""
        node = await self.get_sensor_node(node_id)
        if node_in.tank_id and node_in.tank_id != node.tank_id:
            tank = await self.tank_repo.get(node_in.tank_id)
            if not tank:
                raise NotFoundException(f"Associated Tank with ID {node_in.tank_id} does not exist")

        if node_in.node_name and node_in.node_name != node.node_name:
            existing = await self.sensor_repo.get_by_name(node_in.node_name)
            if existing:
                raise DuplicateEntityException(f"Sensor node '{node_in.node_name}' already exists")

        return await self.sensor_repo.update(node, node_in)

    async def delete_sensor_node(self, node_id: int) -> SensorNode:
        """Delete sensor node record."""
        node = await self.get_sensor_node(node_id)
        await self.sensor_repo.delete(node_id)
        return node
