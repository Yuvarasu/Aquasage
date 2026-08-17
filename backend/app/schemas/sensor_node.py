from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SensorNodeBase(BaseModel):
    tank_id: int
    node_name: str = Field(..., min_length=2, max_length=150)
    status: str = Field("Online", max_length=50)


class SensorNodeCreate(SensorNodeBase):
    pass


class SensorNodeUpdate(BaseModel):
    tank_id: Optional[int] = None
    node_name: Optional[str] = Field(None, min_length=2, max_length=150)
    status: Optional[str] = Field(None, max_length=50)


class SensorNodeResponse(SensorNodeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
