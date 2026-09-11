from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# ============================================================
# CREATE USER
# ============================================================
#
# Dùng cho Admin tạo tài khoản nhân viên.
#
# Không cho client tự truyền password_hash.
# Password sẽ được hash ở router trước khi lưu DB.
# ============================================================

class UserCreate(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=50,
    )

    email: EmailStr

    full_name: str = Field(
        min_length=1,
        max_length=150,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    role_id: int = Field(
        gt=0,
    )


# ============================================================
# UPDATE USER
# ============================================================

class UserUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    email: EmailStr | None = None

    role_id: int | None = Field(
        default=None,
        gt=0,
    )

    is_active: bool | None = None


# ============================================================
# ROLE RESPONSE
# ============================================================

class RoleResponse(BaseModel):
    id: int
    name: str
    description: str | None

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# USER RESPONSE
# ============================================================
#
# Không bao giờ trả password_hash ra API.
# ============================================================

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str
    role_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    role: RoleResponse

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# USER LIST RESPONSE
# ============================================================

class UserListResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str
    role_id: int
    role: RoleResponse
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )