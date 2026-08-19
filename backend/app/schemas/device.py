from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, ConfigDict, Field, model_validator


class DeviceBase(BaseModel):
    device_name: str = Field(..., min_length=2, max_length=150)
    device_type: str = Field("ESP32_CONTROLLER", max_length=50)
    protocol: str = Field("WiFi", max_length=50)
    location: str = Field("Benchtop Prototype", min_length=2, max_length=255)
    firmware_version: str = Field("0.1.0", max_length=50)
    wifi_rssi: int = Field(-55, le=0, ge=-120)
    status: str = Field("Online", max_length=50)
    tank_id: Optional[int] = None

    # Backward-compatible aliases
    node_name: Optional[str] = None
    node_type: Optional[str] = None
    signal_rssi: Optional[int] = None

    @model_validator(mode="before")
    @classmethod
    def harmonize_device_fields(cls, data: dict) -> dict:
        if not isinstance(data, dict):
            return data
        if "node_name" in data and "device_name" not in data:
            data["device_name"] = data["node_name"]
        if "node_type" in data and "device_type" not in data:
            data["device_type"] = data["node_type"]
        if "signal_rssi" in data and "wifi_rssi" not in data:
            data["wifi_rssi"] = data["signal_rssi"]
        return data


class DeviceRegister(DeviceBase):
    device_id: Optional[str] = Field(None, description="Hardware Device ID (e.g., ESP32_TANK_01)")
    node_id: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def harmonize_id(cls, data: dict) -> dict:
        if isinstance(data, dict):
            if "node_id" in data and "device_id" not in data:
                data["device_id"] = data["node_id"]
        return data


class DeviceUpdate(BaseModel):
    device_name: Optional[str] = Field(None, min_length=2, max_length=150)
    device_type: Optional[str] = None
    protocol: Optional[str] = None
    location: Optional[str] = None
    firmware_version: Optional[str] = None
    wifi_rssi: Optional[int] = Field(None, le=0, ge=-120)
    status: Optional[str] = None
    tank_id: Optional[int] = None


class DeviceResponse(DeviceBase):
    id: int
    device_id: str
    last_seen: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
