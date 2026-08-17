from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.tank import Tank


class DeviceNode(Base, TimestampMixin):
    """IoT Edge Controller and Gateway device model (ESP32 DevKit V1 / Simulator)."""

    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)  # e.g., ESP32_TANK_01
    device_name: Mapped[str] = mapped_column(String(150), nullable=False)
    device_type: Mapped[str] = mapped_column(String(50), default="ESP32_CONTROLLER", nullable=False)
    protocol: Mapped[str] = mapped_column(String(50), default="WiFi", nullable=False)
    location: Mapped[str] = mapped_column(String(255), default="Benchtop Prototype", nullable=False)
    firmware_version: Mapped[str] = mapped_column(String(50), default="0.1.0", nullable=False)
    wifi_rssi: Mapped[int] = mapped_column(Integer, default=-55, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Online", nullable=False)
    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    tank_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("tanks.id", ondelete="SET NULL"), nullable=True, index=True)

    # Relationships
    tank: Mapped[Optional["Tank"]] = relationship("Tank", back_populates="devices", lazy="selectin")

    def __repr__(self) -> str:
        return f"<DeviceNode id={self.id} device_id='{self.device_id}' name='{self.device_name}' status='{self.status}'>"
