from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DeviceBase(BaseModel):
    node_name: str = Field(..., min_length=2, max_length=150)
    node_type: str = Field("Sensor", max_length=50)       # Sensor, Actuator, Gateway, Transmitter
    protocol: str = Field("WiFi", max_length=50)          # LoRaWAN, WiFi, RS485/Modbus
    location: str = Field(..., min_length=2, max_length=255)
    firmware_version: str = Field("v1.0.0", max_length=50)
    battery_level: float = Field(100.0, ge=0, le=100)
    signal_rssi: int = Field(-65, le=0, ge=-120)
    status: str = Field("Online", max_length=50)           # Online, Offline, Maintenance
    tank_id: Optional[int] = None


class DeviceRegister(DeviceBase):
    node_id: Optional[str] = Field(None, description="Optional custom node identifier. Auto-generated if omitted.")


class DeviceUpdate(BaseModel):
    node_name: Optional[str] = Field(None, min_length=2, max_length=150)
    node_type: Optional[str] = None
    protocol: Optional[str] = None
    location: Optional[str] = None
    firmware_version: Optional[str] = None
    battery_level: Optional[float] = Field(None, ge=0, le=100)
    signal_rssi: Optional[int] = Field(None, le=0, ge=-120)
    status: Optional[str] = None
    tank_id: Optional[int] = None


class DeviceResponse(DeviceBase):
    id: int
    node_id: str
    last_seen: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
