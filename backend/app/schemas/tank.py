from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TankBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    location: str = Field(..., min_length=2, max_length=255)
    capacity: float = Field(..., gt=0, description="Tank capacity in Liters")
    status: str = Field("Active", max_length=50)


class TankCreate(TankBase):
    pass


class TankUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    location: Optional[str] = Field(None, min_length=2, max_length=255)
    capacity: Optional[float] = Field(None, gt=0)
    status: Optional[str] = Field(None, max_length=50)


class TankResponse(TankBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
