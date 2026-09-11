from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User
from app.models.visitor import Visitor
from app.schemas.user import (
    RoleResponse,
    UserCreate,
    UserListResponse,
    UserResponse,
    UserUpdate,
)

router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


# ============================================================
# GET ROLES
# ============================================================

@router.get(
    "/roles",
    response_model=list[RoleResponse],
)
def get_roles(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    roles = (
        db.query(Role)
        .order_by(Role.id.asc())
        .all()
    )

    return roles


# ============================================================
# GET USERS
# ============================================================

@router.get(
    "",
    response_model=list[UserListResponse],
)
def get_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    users = (
        db.query(User)
        .order_by(User.id.asc())
        .all()
    )

    return users


# ============================================================
# GET USER BY ID
# ============================================================

@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tài khoản",
        )

    return user


# ============================================================
# CREATE USER
# ============================================================

@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    # --------------------------------------------------------
    # Kiểm tra username
    # --------------------------------------------------------

    existing_username = (
        db.query(User)
        .filter(User.username == data.username)
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username đã tồn tại",
        )

    # --------------------------------------------------------
    # Kiểm tra email
    # --------------------------------------------------------

    existing_email = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được sử dụng",
        )

    # --------------------------------------------------------
    # Kiểm tra role
    # --------------------------------------------------------

    role = (
        db.query(Role)
        .filter(Role.id == data.role_id)
        .first()
    )

    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role không tồn tại",
        )

    allowed_roles = {
        "admin",
        "content_staff",
        "ticket_staff",
        "visitor",
    }

    if role.name not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role không hợp lệ",
        )

    # --------------------------------------------------------
    # Tạo user
    # --------------------------------------------------------

    user = User(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        password_hash=hash_password(data.password),
        role_id=role.id,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# ============================================================
# UPDATE USER
# ============================================================

@router.put(
    "/{user_id}",
    response_model=UserResponse,
)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    # --------------------------------------------------------
    # Tìm user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tài khoản",
        )

    # --------------------------------------------------------
    # Không cho Admin tự đổi role
    # --------------------------------------------------------

    if (
        user.id == current_admin.id
        and data.role_id is not None
        and data.role_id != user.role_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể tự thay đổi role của chính mình",
        )

    # --------------------------------------------------------
    # Không cho Admin tự khóa tài khoản
    # --------------------------------------------------------

    if (
        user.id == current_admin.id
        and data.is_active is False
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể tự khóa tài khoản Admin hiện tại",
        )

    # --------------------------------------------------------
    # Kiểm tra email
    # --------------------------------------------------------

    if data.email is not None:
        existing_email = (
            db.query(User)
            .filter(
                User.email == data.email,
                User.id != user.id,
            )
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email đã được sử dụng bởi tài khoản khác",
            )

        user.email = data.email

    # --------------------------------------------------------
    # Full name
    # --------------------------------------------------------

    if data.full_name is not None:
        user.full_name = data.full_name

    # --------------------------------------------------------
    # Role
    # --------------------------------------------------------

    if data.role_id is not None:
        role = (
            db.query(Role)
            .filter(Role.id == data.role_id)
            .first()
        )

        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role không tồn tại",
            )

        allowed_roles = {
            "admin",
            "content_staff",
            "ticket_staff",
            "visitor",
        }

        if role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role không hợp lệ",
            )

        user.role_id = role.id

    # --------------------------------------------------------
    # Active status
    # --------------------------------------------------------

    if data.is_active is not None:
        user.is_active = data.is_active

    db.commit()
    db.refresh(user)

    return user


# ============================================================
# DELETE USER
# ============================================================
#
# Physical delete:
# - Xóa tài khoản khỏi bảng users.
# - Không cho Admin tự xóa mình.
# - Nếu là visitor:
#     + Tách liên kết Visitor.user_id = NULL
#     + Giữ nguyên hồ sơ visitor
#     + Giữ nguyên vé / phản hồi
#     + Sau đó xóa user
# - Response được tạo trước khi DELETE để tránh
#   DetachedInstanceError.
# ============================================================

@router.delete(
    "/{user_id}",
    response_model=UserResponse,
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    # --------------------------------------------------------
    # Tìm user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tài khoản",
        )

    # --------------------------------------------------------
    # Không cho Admin tự xóa chính mình
    # --------------------------------------------------------

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể tự xóa tài khoản Admin hiện tại",
        )

    # --------------------------------------------------------
    # Lưu dữ liệu response trước khi xóa
    #
    # UserResponse có trường role.
    # Vì vậy phải đọc role khi User vẫn còn trong Session.
    # --------------------------------------------------------

    response_data = UserResponse.model_validate(user)

    # --------------------------------------------------------
    # Nếu user có hồ sơ Visitor
    #
    # FK:
    # visitors.user_id -> users.id
    # ON DELETE NO ACTION
    #
    # Tách liên kết trước khi xóa User.
    # Hồ sơ Visitor vẫn được giữ lại.
    # --------------------------------------------------------

    visitor = (
        db.query(Visitor)
        .filter(Visitor.user_id == user.id)
        .first()
    )

    if visitor:
        visitor.user_id = None

    # --------------------------------------------------------
    # Xóa vật lý User
    # --------------------------------------------------------

    db.delete(user)
    db.commit()

    # --------------------------------------------------------
    # Trả dữ liệu đã chuẩn bị trước khi DELETE
    # --------------------------------------------------------

    return response_data