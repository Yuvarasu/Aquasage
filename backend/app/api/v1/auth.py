from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import get_auth_service, get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshTokenRequest, TokenResponse
from app.schemas.common import StandardResponse
from app.schemas.user import UserResponse
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=StandardResponse[TokenResponse])
async def login(
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Authenticate user with credentials and issue JWT tokens."""
    tokens = await auth_service.authenticate_user(login_data)
    return StandardResponse(
        success=True,
        message="Login successful",
        data=tokens,
    )


@router.post("/login/form", response_model=TokenResponse)
async def login_swagger_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service),
):
    """OAuth2 compatible form endpoint for Swagger UI Authorize button."""
    login_req = LoginRequest(email=form_data.username, password=form_data.password)
    tokens = await auth_service.authenticate_user(login_req)
    return tokens


@router.post("/refresh", response_model=StandardResponse[TokenResponse])
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Refresh expired access token using a valid refresh token."""
    tokens = await auth_service.refresh_access_token(refresh_data.refresh_token)
    return StandardResponse(
        success=True,
        message="Token refreshed successfully",
        data=tokens,
    )


@router.get("/me", response_model=StandardResponse[UserResponse])
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Fetch current authenticated user profile."""
    return StandardResponse(
        success=True,
        message="Profile fetched successfully",
        data=UserResponse.model_validate(current_user),
    )
