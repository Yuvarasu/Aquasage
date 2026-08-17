from datetime import timedelta
from app.core.config import settings
from app.core.exceptions import AuthenticationException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.repositories.user import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse


class AuthService:
    """Service layer handling authentication logic."""

    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def authenticate_user(self, login_data: LoginRequest) -> TokenResponse:
        """Authenticate user with email and password, returning JWT access & refresh tokens."""
        user = await self.user_repo.get_by_email(login_data.email)
        if not user:
            raise AuthenticationException("Invalid email or password")

        if not verify_password(login_data.password, user.password_hash):
            raise AuthenticationException("Invalid email or password")

        if not user.is_active:
            raise AuthenticationException("User account is inactive")

        access_token = create_access_token(subject=user.id, role=user.role)
        refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """Refresh JWT access token using a valid refresh token."""
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise AuthenticationException("Invalid refresh token type")

        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationException("Invalid token payload")

        user = await self.user_repo.get(int(user_id))
        if not user or not user.is_active:
            raise AuthenticationException("User not found or inactive")

        access_token = create_access_token(subject=user.id, role=user.role)
        new_refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
