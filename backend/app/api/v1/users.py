from typing import List
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_user_service, require_roles
from app.core.roles import Role
from app.models.user import User
from app.schemas.common import StandardResponse
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user import UserService

router = APIRouter(prefix="/users", tags=["Users Management"])


@router.post(
    "",
    response_model=StandardResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([Role.ADMIN]))],
)
async def create_user(
    user_in: UserCreate,
    user_service: UserService = Depends(get_user_service),
):
    """Create a new user account (Admin only)."""
    user = await user_service.create_user(user_in)
    return StandardResponse(
        success=True,
        message="User created successfully",
        data=UserResponse.model_validate(user),
    )


@router.get(
    "",
    response_model=StandardResponse[List[UserResponse]],
    dependencies=[Depends(require_roles([Role.ADMIN, Role.OPERATOR]))],
)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    user_service: UserService = Depends(get_user_service),
):
    """Fetch paginated list of users (Admin and Operator)."""
    users = await user_service.get_users(skip=skip, limit=limit)
    return StandardResponse(
        success=True,
        message="Users list retrieved successfully",
        data=[UserResponse.model_validate(u) for u in users],
    )


@router.get(
    "/{user_id}",
    response_model=StandardResponse[UserResponse],
    dependencies=[Depends(get_current_user)],
)
async def get_user_by_id(
    user_id: int,
    user_service: UserService = Depends(get_user_service),
):
    """Fetch user details by ID."""
    user = await user_service.get_user_by_id(user_id)
    return StandardResponse(
        success=True,
        message="User details retrieved successfully",
        data=UserResponse.model_validate(user),
    )


@router.put(
    "/{user_id}",
    response_model=StandardResponse[UserResponse],
    dependencies=[Depends(require_roles([Role.ADMIN]))],
)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    user_service: UserService = Depends(get_user_service),
):
    """Update user information (Admin only)."""
    updated_user = await user_service.update_user(user_id, user_in)
    return StandardResponse(
        success=True,
        message="User updated successfully",
        data=UserResponse.model_validate(updated_user),
    )


@router.delete(
    "/{user_id}",
    response_model=StandardResponse[UserResponse],
    dependencies=[Depends(require_roles([Role.ADMIN]))],
)
async def delete_user(
    user_id: int,
    user_service: UserService = Depends(get_user_service),
):
    """Delete a user account (Admin only)."""
    deleted_user = await user_service.delete_user(user_id)
    return StandardResponse(
        success=True,
        message="User deleted successfully",
        data=UserResponse.model_validate(deleted_user),
    )
