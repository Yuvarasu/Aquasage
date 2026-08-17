from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.tank import Tank


class SensorNode(Base, TimestampMixin):
    """ESP32 IoT Sensor Node database model."""

    __tablename__ = "sensor_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    tank_id: Mapped[int] = mapped_column(Integer, ForeignKey("tanks.id", ondelete="CASCADE"), nullable=False, index=True)
    node_name: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Online", nullable=False)

    tank: Mapped["Tank"] = relationship("Tank", back_populates="sensor_nodes")

    def __repr__(self) -> str:
        return f"<SensorNode id={self.id} node_name='{self.node_name}' tank_id={self.tank_id}>"
