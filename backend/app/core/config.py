import json
from typing import Any, List, Union
from pydantic import AnyHttpUrl, Field, PostgresDsn, RedisDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Project Info
    PROJECT_NAME: str = "AI-Powered Rural Water Infrastructure Monitoring Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Security & JWT
    SECRET_KEY: str = "aquasage-super-secret-key-change-in-production-2026-secure-jwt-token-hash-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database Settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "aquasage_db"
    DATABASE_URL: str | None = None

    # Redis Settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str | None = None
    REDIS_URL: str | None = None

    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
    ]

    # Tank Physical Dimensions (Benchtop Prototype)
    DEFAULT_TANK_HEIGHT_CM: float = 25.0
    DEFAULT_TANK_CAPACITY_LITERS: float = 20.0
    TANK_LOW_LEVEL_ALERT_CM: float = 5.0  # Alert when water level drops to <= 5 cm
    TANK_HIGH_LEVEL_ALERT_CM: float = 5.0  # Alert when distance to brim is <= 5 cm

    # Flow Sensor Calibration (pulses/sec per L/min)
    FLOW_SENSOR_1_CALIBRATION_FACTOR: float = 7.5
    FLOW_SENSOR_2_CALIBRATION_FACTOR: float = 7.5

    # Leak Detection Thresholds
    LEAK_MINIMUM_FLOW_LPM: float = 1.0
    LEAK_DIFFERENTIAL_THRESHOLD_LPM: float = 0.5
    LEAK_CONSECUTIVE_READINGS_THRESHOLD: int = 3

    # Water Quality Thresholds
    TDS_THRESHOLD_GOOD_PPM: float = 300.0
    TDS_THRESHOLD_MONITOR_PPM: float = 600.0
    TURBIDITY_THRESHOLD_CLEAR_RAW: int = 1500
    TURBIDITY_THRESHOLD_MODERATE_RAW: int = 3000

    # Logging & Features
    ENABLE_REDIS: bool = True
    LOG_LEVEL: str = "INFO"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    def get_database_url(self) -> str:
        url = self.DATABASE_URL
        if not url:
            url = (
                f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("sqlite://") and not url.startswith("sqlite+aiosqlite://"):
            url = url.replace("sqlite://", "sqlite+aiosqlite://", 1)
        return url

    def get_sync_database_url(self) -> str:
        async_url = self.get_database_url()
        if async_url.startswith("postgresql+asyncpg://"):
            return async_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
        if async_url.startswith("sqlite+aiosqlite://"):
            return async_url.replace("sqlite+aiosqlite://", "sqlite://")
        return async_url

    def get_redis_url(self) -> str:
        if self.REDIS_URL:
            return self.REDIS_URL
        auth = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
        return f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"


settings = Settings()
