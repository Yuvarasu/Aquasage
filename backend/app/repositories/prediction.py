from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.prediction import Prediction
from app.repositories.base import BaseRepository


class PredictionRepository(BaseRepository[Prediction]):
    """Repository handling AI/ML model inference history and queries."""

    def __init__(self, session: AsyncSession):
        super().__init__(Prediction, session)

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

    async def get_history_by_tank(
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
