import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sensor_reading import SensorReading
from app.models.tank import Tank
from app.repositories.sensor_reading import SensorReadingRepository
from app.repositories.tank import TankRepository
from app.services.ai.feature_extractor import FeatureExtractor
from app.services.ai.prediction_engine import (
    DemandForecastingEngine,
    LeakRandomForestPredictor,
    PumpFailurePredictor,
)


def test_feature_extractor_and_prediction_scoring():
    """Verify statistical feature extraction and Random Forest leak scoring."""
    # 1. Simulate reading objects
    mock_readings = [
        SensorReading(
            tank_id=1,
            distance_cm=6.0,
            water_level_pct=80.0,
            flow_1_lpm=10.0,
            flow_2_lpm=7.0,
            flow_difference_lpm=3.0,
            flow_1_total_liters=10.0,
            flow_2_total_liters=7.0,
            tds_ppm=130.0,
            turbidity_raw=1000,
            turbidity_status="Clear",
            water_quality_status="Good",
            pump_status=True,
        ),
        SensorReading(
            tank_id=1,
            distance_cm=6.2,
            water_level_pct=79.3,
            flow_1_lpm=9.9,
            flow_2_lpm=6.9,
            flow_difference_lpm=3.0,
            flow_1_total_liters=12.0,
            flow_2_total_liters=8.4,
            tds_ppm=130.0,
            turbidity_raw=1000,
            turbidity_status="Clear",
            water_quality_status="Good",
            pump_status=True,
        ),
    ]

    features = FeatureExtractor.extract_leak_features(mock_readings)
    assert features["sample_count"] == 2
    assert features["mean_flow_diff"] == 3.0
    assert features["pump_duty_cycle"] == 1.0

    prob, conf, snapshot = LeakRandomForestPredictor.predict(features)
    assert prob >= 0.75
    assert conf >= 0.85
    assert snapshot["model"] == "RandomForestLeakClassifier_v1.0"


def test_demand_forecasting_and_pump_predictor():
    """Verify 24-hour demand forecasting and pump RUL calculation."""
    forecast = DemandForecastingEngine.forecast_24h(tank_id=1, base_hourly_avg_lpm=0.2)
    assert forecast.horizon_hours == 24
    assert len(forecast.forecast_points) == 24
    assert forecast.total_projected_liters > 0

    health, rul = PumpFailurePredictor.evaluate(operating_hours=200.0)
    assert 0 <= health <= 100
    assert rul > 0


@pytest.mark.asyncio
async def test_ai_api_endpoints(client: AsyncClient, db_session: AsyncSession):
    """Verify POST /api/v1/ai/infer/{tank_id}, GET predictions, demand-forecast, and insights."""
    tank_repo = TankRepository(db_session)
    tank = await tank_repo.create(
        {"name": "AI Test Tank", "location": "Lab", "capacity": 20.0, "height_cm": 30.0}
    )

    sensor_repo = SensorReadingRepository(db_session)
    # Seed 3 sensor readings
    for i in range(3):
        await sensor_repo.create(
            {
                "device_id": "ESP32_TANK_01",
                "tank_id": tank.id,
                "distance_cm": 6.0,
                "water_level_pct": 80.0,
                "flow_1_lpm": 9.8,
                "flow_2_lpm": 9.7,
                "flow_difference_lpm": 0.1,
                "flow_1_total_liters": 10.0 + i,
                "flow_2_total_liters": 9.9 + i,
                "tds_ppm": 120.0,
                "turbidity_raw": 1000,
                "turbidity_status": "Clear",
                "water_quality_status": "Good",
                "pump_status": True,
            }
        )

    # 1. Trigger inference
    infer_resp = await client.post(f"/api/v1/ai/infer/{tank.id}")
    assert infer_resp.status_code == 201
    infer_data = infer_resp.json()["data"]
    assert infer_data["tank_id"] == tank.id
    assert infer_data["prediction_type"] == "leak_probability"
    assert infer_data["confidence"] > 0

    # 2. Get predictions history
    pred_resp = await client.get(f"/api/v1/ai/predictions/{tank.id}")
    assert pred_resp.status_code == 200
    assert len(pred_resp.json()["data"]) >= 1

    # 3. Get 24-hour demand forecast
    forecast_resp = await client.get(f"/api/v1/ai/demand-forecast/{tank.id}")
    assert forecast_resp.status_code == 200
    assert len(forecast_resp.json()["data"]["forecast_points"]) == 24

    # 4. Get holistic AI insights summary
    insights_resp = await client.get(f"/api/v1/ai/insights/{tank.id}")
    assert insights_resp.status_code == 200
    insights_data = insights_resp.json()["data"]
    assert insights_data["tank_id"] == tank.id
    assert "pump_health_score" in insights_data
    assert "pump_estimated_rul_hours" in insights_data
