import asyncio
from typing import AsyncGenerator
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.roles import Role
from app.core.security import create_access_token, get_password_hash
from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.models.user import User
from app.models.tank import Tank
from app.models.sensor_node import SensorNode

# Use in-memory SQLite for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop per test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Fixture providing isolated test database session with fresh schema."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Fixture providing HTTPX AsyncClient with DB dependency override."""
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def admin_user(db_session: AsyncSession) -> User:
    """Fixture creating an Admin user in the test database."""
    user = User(
        name="Admin User",
        email="admin@aquasage.io",
        password_hash=get_password_hash("AdminPass123!"),
        role=Role.ADMIN.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
async def viewer_user(db_session: AsyncSession) -> User:
    """Fixture creating a Viewer user in the test database."""
    user = User(
        name="Viewer User",
        email="viewer@aquasage.io",
        password_hash=get_password_hash("ViewerPass123!"),
        role=Role.VIEWER.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def admin_token_headers(admin_user: User) -> dict:
    """Fixture returning Authorization headers with Admin Bearer JWT."""
    token = create_access_token(subject=admin_user.id, role=admin_user.role)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def viewer_token_headers(viewer_user: User) -> dict:
    """Fixture returning Authorization headers with Viewer Bearer JWT."""
    token = create_access_token(subject=viewer_user.id, role=viewer_user.role)
    return {"Authorization": f"Bearer {token}"}
