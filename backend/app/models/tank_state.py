from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.tank import Tank


class TankState(Base, TimestampMixin):
    """Latest Singleton Operational State per Tank (Serves Digital Twin and Live Dashboard)."""

    __tablename__ = "tank_states"

    tank_id: Mapped[int] = mapped_column(Integer, ForeignKey("tanks.id", ondelete="CASCADE"), primary_key=True, index=True)

    # Tank Level
    water_level_percent: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    distance_cm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Flow & Water Balance
    flow_in_lpm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    flow_out_lpm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    water_loss_lpm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    flow_1_total_liters: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    flow_2_total_liters: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Water Quality
    tds_ppm: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    turbidity_raw: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    turbidity_status: Mapped[str] = mapped_column(String(50), nullable=False, default="Clear")
    water_quality_status: Mapped[str] = mapped_column(String(50), nullable=False, default="Good")

    # Pump & System Health
    pump_status: Mapped[str] = mapped_column(String(20), nullable=False, default="OFF")  # ON, OFF
    system_status: Mapped[str] = mapped_column(String(50), nullable=False, default="Optimal")  # Optimal, Warning, Critical
    leak_probability: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    possible_leak: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    last_telemetry_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    tank: Mapped[Optional["Tank"]] = relationship("Tank", back_populates="state")

    def __repr__(self) -> str:
        return (
            f"<TankState tank_id={self.tank_id} level={self.water_level_percent}% "
            f"loss={self.water_loss_lpm}L/m pump={self.pump_status} status={self.system_status}>"
        )
