from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.device import DeviceNode
    from app.models.sensor_node import SensorNode
    from app.models.sensor_reading import SensorReading
    from app.models.tank_state import TankState


class Tank(Base, TimestampMixin):
    """Water Storage Tank database model representing physical/virtual tanks."""

    __tablename__ = "tanks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    capacity: Mapped[float] = mapped_column(Float, nullable=False, default=20.0)  # Storage capacity in Liters
    height_cm: Mapped[float] = mapped_column(Float, nullable=False, default=30.0)  # Total tank height in CM
    diameter_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Tank diameter in CM if cylindrical
    flow_1_calibration: Mapped[float] = mapped_column(Float, nullable=False, default=7.5)  # Pulses/sec per L/min
    flow_2_calibration: Mapped[float] = mapped_column(Float, nullable=False, default=7.5)
    status: Mapped[str] = mapped_column(String(50), default="Active", nullable=False)

    # Relationships
    devices: Mapped[List["DeviceNode"]] = relationship(
        "DeviceNode",
        back_populates="tank",
        lazy="selectin",
    )

    sensor_nodes: Mapped[List["SensorNode"]] = relationship(
        "SensorNode",
        back_populates="tank",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    state: Mapped[Optional["TankState"]] = relationship(
        "TankState",
        back_populates="tank",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    readings: Mapped[List["SensorReading"]] = relationship(
        "SensorReading",
        back_populates="tank",
        cascade="all, delete-orphan",
        lazy="noload",
    )

    def __repr__(self) -> str:
        return f"<Tank id={self.id} name='{self.name}' capacity={self.capacity}L height={self.height_cm}cm status='{self.status}'>"
