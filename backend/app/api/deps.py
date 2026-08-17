from typing import AsyncGenerator, List
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationException, PermissionDeniedException
from app.core.roles import Role
from app.core.security import decode_token
from app.database.session import get_db
from app.models.user import User

# Repositories
from app.repositories.user import UserRepository
from app.repositories.tank import TankRepository
from app.repositories.sensor_node import SensorNodeRepository
from app.repositories.device import DeviceRepository
from app.repositories.sensor_reading import SensorReadingRepository
from app.repositories.alert import AlertRepository

# Services
from app.services.auth import AuthService
from app.services.user import UserService
from app.services.tank import TankService
from app.services.sensor_node import SensorNodeService
from app.services.health import HealthService
from app.services.device import DeviceService
from app.services.alert import AlertService
from app.services.sensor_data import SensorDataService
from app.services.digital_twin import DigitalTwinService
from app.services.analytics import AnalyticsService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Repository Dependencies
def get_user_repository(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_tank_repository(db: AsyncSession = Depends(get_db)) -> TankRepository:
    return TankRepository(db)


def get_sensor_node_repository(db: AsyncSession = Depends(get_db)) -> SensorNodeRepository:
    return SensorNodeRepository(db)


def get_device_repository(db: AsyncSession = Depends(get_db)) -> DeviceRepository:
    return DeviceRepository(db)


def get_sensor_reading_repository(db: AsyncSession = Depends(get_db)) -> SensorReadingRepository:
    return SensorReadingRepository(db)


def get_alert_repository(db: AsyncSession = Depends(get_db)) -> AlertRepository:
    return AlertRepository(db)


# Service Dependencies
def get_auth_service(user_repo: UserRepository = Depends(get_user_repository)) -> AuthService:
    return AuthService(user_repo)


def get_user_service(user_repo: UserRepository = Depends(get_user_repository)) -> UserService:
    return UserService(user_repo)


def get_tank_service(tank_repo: TankRepository = Depends(get_tank_repository)) -> TankService:
    return TankService(tank_repo)


def get_sensor_node_service(
    sensor_repo: SensorNodeRepository = Depends(get_sensor_node_repository),
    tank_repo: TankRepository = Depends(get_tank_repository),
) -> SensorNodeService:
    return SensorNodeService(sensor_repo, tank_repo)


def get_health_service(db: AsyncSession = Depends(get_db)) -> HealthService:
    return HealthService(db)


def get_device_service(device_repo: DeviceRepository = Depends(get_device_repository)) -> DeviceService:
    return DeviceService(device_repo)


def get_alert_service(alert_repo: AlertRepository = Depends(get_alert_repository)) -> AlertService:
    return AlertService(alert_repo)


def get_sensor_data_service(
    sensor_repo: SensorReadingRepository = Depends(get_sensor_reading_repository),
    device_repo: DeviceRepository = Depends(get_device_repository),
    tank_repo: TankRepository = Depends(get_tank_repository),
    alert_service: AlertService = Depends(get_alert_service),
) -> SensorDataService:
    return SensorDataService(sensor_repo, device_repo, tank_repo, alert_service)


def get_digital_twin_service(
    tank_repo: TankRepository = Depends(get_tank_repository),
    sensor_repo: SensorReadingRepository = Depends(get_sensor_reading_repository),
) -> DigitalTwinService:
    return DigitalTwinService(tank_repo, sensor_repo)


def get_analytics_service(
    sensor_repo: SensorReadingRepository = Depends(get_sensor_reading_repository),
) -> AnalyticsService:
    return AnalyticsService(sensor_repo)


# Authentication & Authorization Dependencies
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    """Extract authenticated current user from OAuth2 JWT Bearer Token."""
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise AuthenticationException("Invalid access token type")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationException("Invalid token payload")

    user = await user_repo.get(int(user_id))
    if not user or not user.is_active:
        raise AuthenticationException("User account not active or non-existent")

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency verifying user account is active."""
    if not current_user.is_active:
        raise AuthenticationException("Inactive user account")
    return current_user


# RBAC Role Checker Dependency
class RoleChecker:
    """Dependency for checking if current user has any of the allowed roles."""

    def __init__(self, allowed_roles: List[Role]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if not current_user:
            raise PermissionDeniedException("Authentication required")
        
        user_role_str = getattr(current_user, "role", None)
        if not user_role_str:
            raise PermissionDeniedException("User role not assigned")

        try:
            user_role = Role(user_role_str)
        except ValueError:
            raise PermissionDeniedException(f"Invalid role: {user_role_str}")

        if user_role not in self.allowed_roles and user_role != Role.ADMIN:
            raise PermissionDeniedException(
                f"Role '{user_role.value}' does not have sufficient permissions. Allowed: {[r.value for r in self.allowed_roles]}"
            )
        return current_user


def require_roles(allowed_roles: List[Role]):
    """Helper shortcut to create RoleChecker instance."""
    return RoleChecker(allowed_roles)
