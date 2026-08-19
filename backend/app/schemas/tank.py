from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class TankBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    location: str = Field(..., min_length=2, max_length=255)
    capacity: float = Field(20.0, gt=0, description="Tank capacity in Liters")
    height_cm: float = Field(30.0, gt=0, description="Total tank height in CM")
    diameter_cm: Optional[float] = Field(None, gt=0, description="Tank diameter in CM")
    flow_1_calibration: float = Field(7.5, gt=0, description="Flow Sensor 1 calibration factor")
    flow_2_calibration: float = Field(7.5, gt=0, description="Flow Sensor 2 calibration factor")
    status: str = Field("Active", max_length=50)


class TankCreate(TankBase):
    pass


class TankUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    location: Optional[str] = Field(None, min_length=2, max_length=255)
    capacity: Optional[float] = Field(None, gt=0)
    height_cm: Optional[float] = Field(None, gt=0)
    diameter_cm: Optional[float] = Field(None, gt=0)
    flow_1_calibration: Optional[float] = Field(None, gt=0)
    flow_2_calibration: Optional[float] = Field(None, gt=0)
    status: Optional[str] = Field(None, max_length=50)


class TankResponse(TankBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
