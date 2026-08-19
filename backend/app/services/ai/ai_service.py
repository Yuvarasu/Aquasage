import json
from datetime import datetime, timezone
from typing import List, Optional
from app.core.exceptions import NotFoundException
from app.models.prediction import Prediction
from app.repositories.prediction import PredictionRepository
from app.repositories.sensor_reading import SensorReadingRepository
from app.repositories.tank import TankRepository
from app.schemas.ai import (
    AIInsightsSummaryResponse,
    DemandForecastResponse,
    PredictionResponse,
)
from app.services.ai.feature_extractor import FeatureExtractor
from app.services.ai.prediction_engine import (
    DemandForecastingEngine,
    LeakRandomForestPredictor,
    PumpFailurePredictor,
)


class AIService:
    """Coordinates feature extraction, machine learning inference, and persistence."""

    def __init__(
        self,
        prediction_repo: PredictionRepository,
        sensor_repo: SensorReadingRepository,
        tank_repo: TankRepository,
    ):
        self.prediction_repo = prediction_repo
        self.sensor_repo = sensor_repo
        self.tank_repo = tank_repo

    async def run_leak_inference(self, tank_id: int, window_size: int = 30) -> PredictionResponse:
        """Run ML leak classifier on historical rolling telemetry window and persist inference."""
        tank = await self.tank_repo.get(tank_id)
        if not tank:
            raise NotFoundException(f"Tank with ID {tank_id} not found")

        readings = await self.sensor_repo.get_history_by_tank(tank_id=tank_id, limit=window_size)
        features = FeatureExtractor.extract_leak_features(readings)

        prob, conf, snapshot = LeakRandomForestPredictor.predict(features)

        record = await self.prediction_repo.create_prediction(
            tank_id=tank_id,
            model_name=LeakRandomForestPredictor.MODEL_NAME,
            prediction_type="leak_probability",
            predicted_value=prob,
            confidence=conf,
            features_snapshot=json.dumps(snapshot),
        )

        return PredictionResponse.model_validate(record)

    async def get_tank_predictions(
        self, tank_id: int, prediction_type: Optional[str] = None, limit: int = 20
    ) -> List[PredictionResponse]:
        """Fetch historical model predictions for a tank."""
        records = await self.prediction_repo.get_by_tank(
            tank_id=tank_id, prediction_type=prediction_type, limit=limit
        )
        return [PredictionResponse.model_validate(r) for r in records]

    async def get_demand_forecast(self, tank_id: int) -> DemandForecastResponse:
        """Generate 24-hour ahead demand forecast."""
        tank = await self.tank_repo.get(tank_id)
        if not tank:
            raise NotFoundException(f"Tank with ID {tank_id} not found")

        readings = await self.sensor_repo.get_history_by_tank(tank_id=tank_id, limit=60)
        demand_feat = FeatureExtractor.extract_demand_features(readings)
        avg_lpm = demand_feat.get("hourly_flow_avg", 0.16)

        return DemandForecastingEngine.forecast_24h(tank_id=tank_id, base_hourly_avg_lpm=avg_lpm)

    async def get_ai_insights_summary(self, tank_id: int) -> AIInsightsSummaryResponse:
        """Retrieve holistic AI health insights combining leak, demand, and pump status."""
        tank = await self.tank_repo.get(tank_id)
        if not tank:
            raise NotFoundException(f"Tank with ID {tank_id} not found")

        latest_pred = await self.prediction_repo.get_latest_by_tank(
            tank_id=tank_id, prediction_type="leak_probability"
        )

        leak_prob = latest_pred.predicted_value if latest_pred else 0.04
        status = "Confirmed" if leak_prob >= 0.75 else ("Suspected" if leak_prob >= 0.40 else "Normal")

        health_score, rul_hours = PumpFailurePredictor.evaluate(operating_hours=140.0)
        forecast = await self.get_demand_forecast(tank_id)

        return AIInsightsSummaryResponse(
            tank_id=tank_id,
            leak_probability=round(leak_prob, 2),
            leak_status=status,
            predicted_daily_demand_liters=forecast.total_projected_liters,
            pump_health_score=health_score,
            pump_estimated_rul_hours=rul_hours,
            anomaly_detected=(status != "Normal"),
            latest_prediction_at=latest_pred.timestamp if latest_pred else datetime.now(timezone.utc),
        )
