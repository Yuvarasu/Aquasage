from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.prediction import Prediction
from app.repositories.base import BaseRepository


class PredictionRepository(BaseRepository[Prediction]):
    """Repository handling AI/ML model inference history and queries."""

    def __init__(self, session: AsyncSession):
        super().__init__(Prediction, session)

    async def create_prediction(
        self,
        tank_id: int,
        model_name: str,
        prediction_type: str,
        predicted_value: float,
        confidence: float,
        features_snapshot: Optional[str] = None,
    ) -> Prediction:
        """Persist a newly evaluated AI model prediction."""
        record = Prediction(
            tank_id=tank_id,
            model_name=model_name,
            prediction_type=prediction_type,
            predicted_value=predicted_value,
            confidence=confidence,
            features_snapshot=features_snapshot,
            timestamp=datetime.now(timezone.utc),
        )
        self.session.add(record)
        await self.session.flush()
        await self.session.refresh(record)
        return record

    async def get_latest_by_tank(
        self, tank_id: int, prediction_type: Optional[str] = None
    ) -> Optional[Prediction]:
        """Fetch the most recent prediction for a given tank."""
        stmt = (
            select(Prediction)
            .where(Prediction.tank_id == tank_id)
            .order_by(Prediction.timestamp.desc())
        )
        if prediction_type:
            stmt = stmt.where(Prediction.prediction_type == prediction_type)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_tank(
        self, tank_id: int, prediction_type: Optional[str] = None, limit: int = 50
    ) -> List[Prediction]:
        """Fetch recent prediction history for a tank."""
        stmt = (
            select(Prediction)
            .where(Prediction.tank_id == tank_id)
            .order_by(Prediction.timestamp.desc())
            .limit(limit)
        )
        if prediction_type:
            stmt = stmt.where(Prediction.prediction_type == prediction_type)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_history_by_tank(
        self, tank_id: int, prediction_type: Optional[str] = None, limit: int = 50
    ) -> List[Prediction]:
        """Alias for get_by_tank."""
        return await self.get_by_tank(tank_id=tank_id, prediction_type=prediction_type, limit=limit)
