from typing import List, Optional
from app.core.exceptions import DuplicateEntityException, NotFoundException
from app.core.security import get_password_hash
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """Service layer executing business logic for user management."""

    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def create_user(self, user_in: UserCreate) -> User:
        """Create new user account."""
        existing = await self.user_repo.get_by_email(user_in.email)
        if existing:
            raise DuplicateEntityException(f"User with email '{user_in.email}' already exists")

        user_data = user_in.model_dump()
        raw_password = user_data.pop("password")
        user_data["password_hash"] = get_password_hash(raw_password)

        return await self.user_repo.create(user_data)

    async def get_user_by_id(self, user_id: int) -> User:
        """Get user by ID or raise NotFoundException."""
        user = await self.user_repo.get(user_id)
        if not user:
            raise NotFoundException(f"User with ID {user_id} not found")
        return user

    async def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Fetch list of users."""
        return await self.user_repo.get_multi(skip=skip, limit=limit)

    async def update_user(self, user_id: int, user_in: UserUpdate) -> User:
        """Update existing user record."""
        user = await self.get_user_by_id(user_id)

        update_data = user_in.model_dump(exclude_unset=True)
        if "email" in update_data and update_data["email"] != user.email:
            existing = await self.user_repo.get_by_email(update_data["email"])
            if existing:
                raise DuplicateEntityException(f"Email '{update_data['email']}' already in use")

        if "password" in update_data and update_data["password"]:
            raw_pwd = update_data.pop("password")
            update_data["password_hash"] = get_password_hash(raw_pwd)

        return await self.user_repo.update(user, update_data)

    async def delete_user(self, user_id: int) -> User:
        """Delete user account."""
        user = await self.get_user_by_id(user_id)
        await self.user_repo.delete(user_id)
        return user
