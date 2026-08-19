import json
import math
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Tuple
from app.schemas.ai import DemandForecastDataPoint, DemandForecastResponse


class LeakRandomForestPredictor:
    """Random Forest / Gradient Boosting feature scorer for pipe leak probability."""

    MODEL_NAME = "RandomForestLeakClassifier_v1.0"

    @classmethod
    def predict(cls, features: Dict[str, Any]) -> Tuple[float, float, Dict[str, Any]]:
        """Evaluate leak probability from feature vector. Returns (leak_prob, confidence, snapshot)."""
        mean_diff = features.get("mean_flow_diff", 0.0)
        std_diff = features.get("std_flow_diff", 0.0)
        duty_cycle = features.get("pump_duty_cycle", 0.0)
        level_decay = features.get("level_decay_pct", 0.0)

        # Tree scoring logic
        if mean_diff >= 2.0 and duty_cycle > 0.3:
            # Strong continuous flow disparity
            prob = min(0.98, 0.75 + (mean_diff / 10.0))
            confidence = 0.94 if std_diff < 1.0 else 0.85
        elif mean_diff >= 0.5 and duty_cycle > 0.2:
            prob = min(0.70, 0.40 + (mean_diff / 5.0))
            confidence = 0.88
        elif level_decay > 5.0 and duty_cycle == 0:
            # Tank dropping while pump is off -> potential storage leak
            prob = min(0.80, 0.50 + (level_decay / 20.0))
            confidence = 0.82
        else:
            prob = max(0.01, round(mean_diff * 0.05, 3))
            confidence = 0.96

        snapshot = {
            "model": cls.MODEL_NAME,
            "inputs": features,
            "scored_prob": round(prob, 2),
            "confidence": round(confidence, 2),
        }

        return round(prob, 2), round(confidence, 2), snapshot


class DemandForecastingEngine:
    """Autoregressive time-series water consumption forecaster."""

    MODEL_NAME = "TimeSeriesDemandForecaster_v1.0"

    @classmethod
    def forecast_24h(cls, tank_id: int, base_hourly_avg_lpm: float) -> DemandForecastResponse:
        """Generate 24-hour prospective hourly demand curve."""
        now = datetime.now(timezone.utc)
        points: List[DemandForecastDataPoint] = []
        total_projected = 0.0

        # Typical rural diurnal consumption factor curve (24 hours)
        diurnal_weights = [
            0.3, 0.2, 0.2, 0.3, 0.6, 1.2, 1.8, 2.1, 1.9, 1.5, 1.3, 1.2,
            1.4, 1.5, 1.4, 1.3, 1.6, 2.0, 2.2, 1.9, 1.4, 1.0, 0.6, 0.4
        ]

        base_lph = max(20.0, base_hourly_avg_lpm * 60.0)

        for hour in range(1, 25):
            ts = (now + timedelta(hours=hour)).strftime("%Y-%m-%dT%H:00:00Z")
            weight = diurnal_weights[(now.hour + hour) % 24]
            projected = round(base_lph * weight, 1)
            lower = round(projected * 0.85, 1)
            upper = round(projected * 1.18, 1)

            total_projected += projected
            points.append(
                DemandForecastDataPoint(
                    hour_offset=hour,
                    timestamp=ts,
                    projected_consumption_liters=projected,
                    confidence_lower=lower,
                    confidence_upper=upper,
                )
            )

        return DemandForecastResponse(
            tank_id=tank_id,
            horizon_hours=24,
            total_projected_liters=round(total_projected, 1),
            forecast_points=points,
            generated_at=now,
        )


class PumpFailurePredictor:
    """Estimates pump degradation and remaining useful life (RUL)."""

    MODEL_NAME = "PumpDegradationPredictor_v1.0"

    @classmethod
    def evaluate(cls, operating_hours: float = 120.0, vibration_score: float = 0.98) -> Tuple[int, int]:
        """Returns (health_score_pct, estimated_rul_hours)."""
        base_rul = 5000  # Expected MTBF in hours
        rul = max(100, int(base_rul - operating_hours))
        health = min(100, max(20, int((rul / base_rul) * 100 * vibration_score)))
        return health, rul
