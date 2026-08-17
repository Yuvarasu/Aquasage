from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.tank import Tank


class SensorReading(Base, TimestampMixin):
    """Historical IoT Sensor Telemetry Reading model (Immutable time-series records)."""

    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)  # e.g., ESP32_TANK_01
    tank_id: Mapped[int] = mapped_column(Integer, ForeignKey("tanks.id", ondelete="CASCADE"), nullable=False, index=True)

    # HC-SR04 Ultrasonic Tank Level Metrics
    distance_cm: Mapped[float] = mapped_column(Float, nullable=False)
    water_level_pct: Mapped[float] = mapped_column(Float, nullable=False)

    # Dual YF-S201 Flow Metrics
    flow_1_lpm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    flow_2_lpm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    flow_1_total_liters: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    flow_2_total_liters: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Differential Flow Leak Metrics
    flow_difference_lpm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    estimated_water_loss_lpm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    possible_leak: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    leak_probability: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Water Quality (TDS & Turbidity)
    tds_ppm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    turbidity_raw: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    turbidity_status: Mapped[str] = mapped_column(String(50), nullable=False, default="Clear")  # Clear, Moderate, High
    water_quality_status: Mapped[str] = mapped_column(String(50), nullable=False, default="Good")  # Good, Monitor, High

    # Pump & Edge Device Telemetry
    pump_status: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    wifi_rssi: Mapped[int] = mapped_column(Integer, nullable=False, default=-55)

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Relationships
    tank: Mapped[Optional["Tank"]] = relationship("Tank", back_populates="readings")

    def __repr__(self) -> str:
        return (
            f"<SensorReading id={self.id} device='{self.device_id}' tank_id={self.tank_id} "
            f"level={self.water_level_pct}% flow1={self.flow_1_lpm} flow2={self.flow_2_lpm} leak={self.possible_leak}>"
        )
