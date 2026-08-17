from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AlertCreate(BaseModel):
    alarm_code: str = Field(..., max_length=50)
    title: str = Field(..., max_length=200)
    message: str = Field(..., max_length=500)
    severity: str = Field("warning", max_length=50)  # critical, warning, info
    source_node: str = Field("PRESSURE_SEN_01", max_length=100)


class AlertResponse(BaseModel):
    id: str
    timestamp: str
    title: str
    message: str
    severity: str
    sourceNode: str
    acknowledged: bool

    model_config = ConfigDict(from_attributes=True)
