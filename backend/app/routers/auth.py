from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.role import Role
from app.models.user import User
from app.models.visitor import Visitor
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    UpdateProfileRequest,
    UserResponse,
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# ============================================================
# MANAGEMENT ROLES
# ============================================================
#
# Chỉ 3 role sau được phép đăng nhập vào hệ thống quản lý:
#
# - admin
# - content_staff
# - ticket_staff
#
# visitor là tài khoản người dùng bên ngoài hệ thống quản lý,
# vì vậy không được cấp JWT Management.
# ============================================================

MANAGEMENT_ROLES = {
    "admin",
    "content_staff",
    "ticket_staff",
}


# ============================================================
# REGISTER
# ============================================================
#
# Tài khoản đăng ký từ giao diện người dùng luôn là VISITOR.
#
# Không cho phép client truyền role.
# Không cho phép tự đăng ký:
# - admin
# - content_staff
# - ticket_staff
#
# Staff/Admin phải được tạo hoặc phân quyền bởi Admin.
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
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
    # Lấy role visitor
    # --------------------------------------------------------

    visitor_role = (
        db.query(Role)
        .filter(Role.name == "visitor")
        .first()
    )

    if not visitor_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Role visitor chưa tồn tại. "
                "Hãy chạy seed role trước khi đăng ký."
            ),
        )

    # --------------------------------------------------------
    # Tạo USER
    # --------------------------------------------------------

    user = User(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        password_hash=hash_password(data.password),
        role_id=visitor_role.id,
        is_active=True,
    )

    db.add(user)
    db.flush()

    # --------------------------------------------------------
    # Tạo VISITOR PROFILE
    # --------------------------------------------------------

    visitor = Visitor(
        user_id=user.id,
        visitor_code=f"VIS-{user.id:05d}",
        full_name=user.full_name,
        email=user.email,
        is_active=True,
    )

    db.add(visitor)

    # --------------------------------------------------------
    # Commit transaction
    # --------------------------------------------------------

    db.commit()
    db.refresh(user)

    return user


# ============================================================
# LOGIN
# ============================================================
#
# Đây là endpoint đăng nhập cho hệ thống Management.
#
# visitor:
# - Có thể tồn tại trong database.
# - Có thể nhập đúng username/password.
# - Nhưng KHÔNG được cấp JWT Management.
# - Backend trả HTTP 403.
#
# Admin / Content Staff / Ticket Staff:
# - Được xác thực.
# - Được cấp JWT.
# ============================================================

@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Tìm user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.username == data.username)
        .first()
    )

    # Không tiết lộ username có tồn tại hay không.
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username hoặc mật khẩu không đúng",
        )

    # --------------------------------------------------------
    # Kiểm tra password
    # --------------------------------------------------------

    if not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username hoặc mật khẩu không đúng",
        )

    # --------------------------------------------------------
    # Kiểm tra tài khoản bị khóa
    # --------------------------------------------------------

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã bị khóa",
        )

    # --------------------------------------------------------
    # Kiểm tra role
    # --------------------------------------------------------

    if not user.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản chưa được phân quyền",
        )

    # --------------------------------------------------------
    # CHẶN VISITOR
    # --------------------------------------------------------
    #
    # visitor không thuộc hệ thống Management.
    #
    # Quan trọng:
    # Kiểm tra trước khi tạo JWT.
    # Vì vậy visitor không nhận được access_token.
    # --------------------------------------------------------

    if user.role.name not in MANAGEMENT_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Tài khoản khách tham quan không được phép "
                "đăng nhập vào hệ thống quản lý."
            ),
        )

    # --------------------------------------------------------
    # Tạo JWT
    # --------------------------------------------------------

    token = create_access_token(
        user_id=user.id,
        role=user.role.name,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


# ============================================================
# UPDATE CURRENT USER PROFILE
# ============================================================
#
# Người dùng chỉ được sửa thông tin profile cá nhân:
# - email
# - full_name
# - phone
# - address
#
# Không được sửa:
# - username
# - password
# - role
# - role_id
# - is_active
# ============================================================

@router.put(
    "/me",
    response_model=UserResponse,
)
def update_me(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Kiểm tra email có thuộc tài khoản khác không
    # --------------------------------------------------------

    existing_email = (
        db.query(User)
        .filter(
            User.email == data.email,
            User.id != current_user.id,
        )
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được sử dụng bởi tài khoản khác",
        )

    # --------------------------------------------------------
    # Cập nhật USER
    # --------------------------------------------------------

    current_user.email = data.email
    current_user.full_name = data.full_name

    # --------------------------------------------------------
    # Cập nhật VISITOR PROFILE
    # --------------------------------------------------------

    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.user_id == current_user.id,
        )
        .first()
    )

    if visitor:
        visitor.email = data.email
        visitor.full_name = data.full_name
        visitor.phone = data.phone
        visitor.address = data.address

    # --------------------------------------------------------
    # Commit
    # --------------------------------------------------------

    db.commit()
    db.refresh(current_user)

    return current_user