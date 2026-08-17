from app.repositories.base import BaseRepository
from app.repositories.user import UserRepository
from app.repositories.tank import TankRepository
from app.repositories.device import DeviceRepository
from app.repositories.sensor_reading import SensorReadingRepository
from app.repositories.tank_state import TankStateRepository
from app.repositories.alert import AlertRepository
from app.repositories.prediction import PredictionRepository

__all__ = [
    "BaseRepository",
    "UserRepository",
    "TankRepository",
    "DeviceRepository",
    "SensorReadingRepository",
    "TankStateRepository",
    "AlertRepository",
    "PredictionRepository",
]
