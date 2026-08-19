import uuid
from typing import List, Union
from app.core.exceptions import DuplicateEntityException, NotFoundException
from app.models.device import DeviceNode
from app.repositories.device import DeviceRepository
from app.schemas.device import DeviceRegister, DeviceUpdate


class DeviceService:
    """Service executing device management logic."""

    def __init__(self, device_repo: DeviceRepository):
        self.device_repo = device_repo

    async def register_device(self, device_in: DeviceRegister) -> DeviceNode:
        """Register a new IoT edge device controller (e.g. ESP32_TANK_01)."""
        hardware_id = device_in.device_id or device_in.node_id
        if not hardware_id:
            hardware_id = f"ESP32_TANK_{uuid.uuid4().hex[:6].upper()}"

        existing = await self.device_repo.get_by_device_id(hardware_id)
        if existing:
            raise DuplicateEntityException(f"Device with ID '{hardware_id}' already registered")

        device_dict = device_in.model_dump()
        device_dict["device_id"] = hardware_id
        device_dict["device_name"] = device_in.device_name or f"Edge Node {hardware_id}"

        # Clean legacy alias fields if present
        device_dict.pop("node_id", None)
        device_dict.pop("node_name", None)
        device_dict.pop("node_type", None)
        device_dict.pop("signal_rssi", None)

        return await self.device_repo.create(device_dict)

    async def get_device(self, device_id: Union[int, str]) -> DeviceNode:
        """Get device details by integer ID or string device_id."""
        if isinstance(device_id, int) or str(device_id).isdigit():
            device = await self.device_repo.get(int(device_id))
        else:
            device = await self.device_repo.get_by_device_id(str(device_id))

        if not device:
            raise NotFoundException(f"Device with ID '{device_id}' not found")
        return device

    async def get_devices(self, skip: int = 0, limit: int = 100) -> List[DeviceNode]:
        """Fetch list of devices."""
        return await self.device_repo.get_multi(skip=skip, limit=limit)

    async def update_device(self, device_id: int, device_in: DeviceUpdate) -> DeviceNode:
        """Update device details."""
        device = await self.get_device(device_id)
        update_dict = device_in.model_dump(exclude_unset=True)
        return await self.device_repo.update(device, update_dict)
