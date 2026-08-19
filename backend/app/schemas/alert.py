from datetime import datetime, timezone
from typing import Optional, Union
from pydantic import BaseModel, ConfigDict, Field


class AlertCreate(BaseModel):
    tank_id: Optional[int] = None
    alarm_code: str = Field(..., max_length=50)
    type: str = Field("System", max_length=50)
    title: str = Field(..., max_length=200)
    message: str = Field(..., max_length=500)
    severity: str = Field("warning", max_length=50)  # critical, warning, info
    source_node: str = Field("ESP32_TANK_01", max_length=100)


class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: Optional[str] = None
    notes: Optional[str] = None


class AlertResponse(BaseModel):
    """Section 18 Alert Response Schema (Compatible with frontend SCADAAlarm)."""
    id: Union[int, str]
    tank_id: Optional[int] = None
    alarm_code: Optional[str] = None
    type: str = "System"
    title: str
    message: str
    severity: str  # critical, warning, info
    source_node: Optional[str] = "ESP32_TANK_01"
    sourceNode: Optional[str] = "ESP32_TANK_01"
    acknowledged: bool = False
    timestamp: Union[datetime, str]

    model_config = ConfigDict(from_attributes=True)
