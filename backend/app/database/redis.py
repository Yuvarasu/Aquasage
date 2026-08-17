import json
from typing import Any, Optional
import redis.asyncio as aioredis
from redis.asyncio.client import Redis

from app.core.config import settings
from app.core.logging import logger

redis_client: Optional[Redis] = None


async def get_redis_client() -> Optional[Redis]:
    """Retrieves or initializes the global Redis connection pool."""
    global redis_client
    if redis_client is None:
        try:
            redis_client = aioredis.from_url(
                settings.get_redis_url(),
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=3.0,
            )
            # Test ping connection
            await redis_client.ping()
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Operating without Redis cache.")
            redis_client = None
    return redis_client


async def close_redis_connection() -> None:
    """Closes Redis connection pool."""
    global redis_client
    if redis_client is not None:
        await redis_client.close()
        redis_client = None
        logger.info("Closed Redis connection.")


class RedisCacheService:
    """Cache abstraction wrapper over Redis."""

    def __init__(self, client: Optional[Redis] = None):
        self.client = client

    async def get(self, key: str) -> Optional[Any]:
        if not self.client:
            client = await get_redis_client()
            if not client:
                return None
            self.client = client

        try:
            val = await self.client.get(key)
            if val:
                return json.loads(val)
            return None
        except Exception as e:
            logger.warning(f"Redis GET failed for key {key}: {e}")
            return None

    async def set(self, key: str, value: Any, expire_seconds: int = 300) -> bool:
        if not self.client:
            client = await get_redis_client()
            if not client:
                return False
            self.client = client

        try:
            encoded = json.dumps(value, default=str)
            await self.client.set(key, encoded, ex=expire_seconds)
            return True
        except Exception as e:
            logger.warning(f"Redis SET failed for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        if not self.client:
            client = await get_redis_client()
            if not client:
                return False
            self.client = client

        try:
            await self.client.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Redis DELETE failed for key {key}: {e}")
            return False
