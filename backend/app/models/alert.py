from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TimestampMixin


class SCADAAlarmModel(Base, TimestampMixin):
    """System and Sensor Anomaly Alert model."""

    __tablename__ = "scada_alarms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    tank_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("tanks.id", ondelete="CASCADE"), nullable=True, index=True)
    alarm_code: Mapped[str] = mapped_column(String(50), index=True, nullable=False, default="ANOMALY_01")
    type: Mapped[str] = mapped_column(String(50), index=True, nullable=False, default="System")
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    severity: Mapped[str] = mapped_column(String(50), default="warning", nullable=False)  # critical, warning, info
    source_node: Mapped[str] = mapped_column(String(100), default="ESP32_TANK_01", nullable=False)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    def __repr__(self) -> str:
        return f"<SCADAAlarmModel id={self.id} type='{self.type}' title='{self.title}' severity='{self.severity}'>"
