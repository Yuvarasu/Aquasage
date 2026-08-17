import uuid
from typing import List
from app.core.exceptions import DuplicateEntityException, NotFoundException
from app.models.device import DeviceNode
from app.repositories.device import DeviceRepository
from app.schemas.device import DeviceRegister, DeviceUpdate


class DeviceService:
    """Service executing device management logic."""

    def __init__(self, device_repo: DeviceRepository):
        self.device_repo = device_repo

    async def register_device(self, device_in: DeviceRegister) -> DeviceNode:
        """Register a new IoT sensor node or gateway."""
        if device_in.node_id:
            existing = await self.device_repo.get_by_node_id(device_in.node_id)
            if existing:
                raise DuplicateEntityException(f"Device with node_id '{device_in.node_id}' already registered")
        else:
            device_in.node_id = f"NODE-{uuid.uuid4().hex[:8].upper()}"

        existing_name = await self.device_repo.get_by_node_name(device_in.node_name)
        if existing_name:
            raise DuplicateEntityException(f"Device name '{device_in.node_name}' already exists")

        return await self.device_repo.create(device_in)

    async def get_device(self, device_id: int) -> DeviceNode:
        """Get device details by ID."""
        device = await self.device_repo.get(device_id)
        if not device:
            raise NotFoundException(f"Device with ID {device_id} not found")
        return device

    async def get_devices(self, skip: int = 0, limit: int = 100) -> List[DeviceNode]:
        """Fetch list of devices."""
        return await self.device_repo.get_multi(skip=skip, limit=limit)

    async def update_device(self, device_id: int, device_in: DeviceUpdate) -> DeviceNode:
        """Update device details."""
        device = await self.get_device(device_id)
        if device_in.node_name and device_in.node_name != device.node_name:
            existing_name = await self.device_repo.get_by_node_name(device_in.node_name)
            if existing_name:
                raise DuplicateEntityException(f"Device name '{device_in.node_name}' already exists")
        return await self.device_repo.update(device, device_in)
