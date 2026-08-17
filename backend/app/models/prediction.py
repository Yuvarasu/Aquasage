from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TimestampMixin


class Prediction(Base, TimestampMixin):
    """AI/ML Model Inference Output Records."""

    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    tank_id: Mapped[int] = mapped_column(Integer, ForeignKey("tanks.id", ondelete="CASCADE"), nullable=False, index=True)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., LeakRandomForestClassifier, DemandForecaster
    prediction_type: Mapped[str] = mapped_column(String(50), nullable=False)  # leak_probability, demand_forecast, pump_failure
    predicted_value: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    features_snapshot: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON snapshot of model inputs
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    def __repr__(self) -> str:
        return f"<Prediction id={self.id} model='{self.model_name}' type='{self.prediction_type}' val={self.predicted_value}>"
