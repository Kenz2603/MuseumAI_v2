from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=50,
    )

    email: EmailStr

    full_name: str = Field(
        min_length=2,
        max_length=150,
    )

    password: str = Field(
        min_length=6,
        max_length=100,
    )


class UpdateProfileRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(
        min_length=2,
        max_length=150,
    )
    phone: str | None = Field(
        default=None,
        max_length=30,
    )
    address: str | None = Field(
        default=None,
        max_length=500,
    )


class LoginRequest(BaseModel):
    username: str
    password: str


class RoleResponse(BaseModel):
    id: int
    name: str
    description: str | None = None

    model_config = ConfigDict(
        from_attributes=True,
    )


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str
    is_active: bool
    role: RoleResponse

    model_config = ConfigDict(
        from_attributes=True,
    )


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ============================================================
# LOGIN HISTORY
# ============================================================


class LoginHistoryItem(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    login_at: datetime
    ip_address: str | None = None


class LoginHistoryResponse(BaseModel):
    items: list[LoginHistoryItem]
    total: int