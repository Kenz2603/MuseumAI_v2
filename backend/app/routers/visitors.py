from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User
from app.models.visitor import Visitor
from app.schemas.visitor import (
    VisitorAccountCreate,
    VisitorCreate,
    VisitorResponse,
    VisitorUpdate,
)

router = APIRouter(
    prefix="/api/visitors",
    tags=["Visitors"],
)


# ============================================================
# CREATE VISITOR
# ADMIN / TICKET STAFF
#
# Có thể tạo khách tham quan kèm tài khoản đăng nhập.
#
# Nếu create_account = True:
# - Tạo User
# - Role = visitor
# - Hash password
# - Liên kết Visitor.user_id -> User.id
# - Toàn bộ thao tác nằm trong cùng transaction
# ============================================================

@router.post(
    "",
    response_model=VisitorResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_visitor(
    data: VisitorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "ticket_staff",
        )
    ),
):
    # --------------------------------------------------------
    # 1. Kiểm tra mã khách tham quan
    # --------------------------------------------------------

    existing_visitor = (
        db.query(Visitor)
        .filter(
            Visitor.visitor_code == data.visitor_code,
        )
        .first()
    )

    if existing_visitor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã khách tham quan đã tồn tại",
        )

    # --------------------------------------------------------
    # 2. Kiểm tra dữ liệu tài khoản nếu có yêu cầu tạo account
    # --------------------------------------------------------

    if data.create_account:
        if not data.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vui lòng nhập tên đăng nhập",
            )

        if not data.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vui lòng nhập mật khẩu",
            )

        if not data.email or not data.email.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email là bắt buộc khi tạo tài khoản",
            )

        username = data.username.strip()
        email = data.email.strip()

        # ----------------------------------------------------
        # 3. Kiểm tra username trùng
        # ----------------------------------------------------

        existing_user = (
            db.query(User)
            .filter(
                User.username == username,
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tên đăng nhập đã tồn tại",
            )

        # ----------------------------------------------------
        # 4. Kiểm tra email trùng
        # ----------------------------------------------------

        existing_email = (
            db.query(User)
            .filter(
                User.email == email,
            )
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email tài khoản đã tồn tại",
            )

        # ----------------------------------------------------
        # 5. Kiểm tra role visitor
        # ----------------------------------------------------

        visitor_role = (
            db.query(Role)
            .filter(
                Role.name == "visitor",
            )
            .first()
        )

        if not visitor_role:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Không tìm thấy role visitor trong hệ thống",
            )

    else:
        username = None
        email = data.email.strip() if data.email else None
        visitor_role = None

    # --------------------------------------------------------
    # 6. Tạo Visitor + User trong cùng transaction
    # --------------------------------------------------------

    try:
        visitor = Visitor(
            visitor_code=data.visitor_code,
            full_name=data.full_name,
            email=email,
            phone=data.phone,
            address=data.address,
            notes=data.notes,
            is_active=True,
        )

        db.add(visitor)

        # Flush để lấy visitor.id trước khi tạo User.
        db.flush()

        # ----------------------------------------------------
        # 7. Nếu được yêu cầu thì tạo User role visitor
        # ----------------------------------------------------

        if data.create_account:
            user = User(
                username=username,
                email=email,
                full_name=data.full_name,
                password_hash=hash_password(data.password),
                role_id=visitor_role.id,
                is_active=True,
            )

            db.add(user)

            # Lấy user.id
            db.flush()

            # Liên kết Visitor với User
            visitor.user_id = user.id

        # ----------------------------------------------------
        # 8. Commit toàn bộ transaction
        # ----------------------------------------------------

        db.commit()

        db.refresh(visitor)

        return visitor

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Không thể tạo khách tham quan hoặc tài khoản "
                "do dữ liệu bị trùng hoặc không hợp lệ"
            ),
        )


# ============================================================
# CREATE ACCOUNT FOR EXISTING VISITOR
# ADMIN / TICKET STAFF
#
# Dùng cho Visitor đã tồn tại nhưng chưa có tài khoản.
#
# POST:
# /api/visitors/{visitor_id}/account
#
# Không tự sinh mật khẩu.
# Username và password phải do người quản lý cung cấp.
# Email được lấy từ Visitor.email.
# ============================================================

@router.post(
    "/{visitor_id}/account",
    response_model=VisitorResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_visitor_account(
    visitor_id: int,
    data: VisitorAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "ticket_staff",
        )
    ),
):
    # --------------------------------------------------------
    # 1. Tìm Visitor
    # --------------------------------------------------------

    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.id == visitor_id,
        )
        .first()
    )

    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khách tham quan",
        )

    # --------------------------------------------------------
    # 2. Kiểm tra Visitor đã có tài khoản chưa
    # --------------------------------------------------------

    if visitor.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Khách tham quan này đã có tài khoản",
        )

    # --------------------------------------------------------
    # 3. Visitor phải có email
    #
    # User.email trong database là NOT NULL.
    # --------------------------------------------------------

    if not visitor.email or not visitor.email.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Khách tham quan chưa có email. "
                "Vui lòng cập nhật email trước khi tạo tài khoản."
            ),
        )

    username = data.username.strip()
    email = visitor.email.strip()

    # --------------------------------------------------------
    # 4. Kiểm tra username trùng
    # --------------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.username == username,
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên đăng nhập đã tồn tại",
        )

    # --------------------------------------------------------
    # 5. Kiểm tra email trùng
    # --------------------------------------------------------

    existing_email = (
        db.query(User)
        .filter(
            User.email == email,
        )
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email của khách tham quan đã được sử dụng cho tài khoản khác",
        )

    # --------------------------------------------------------
    # 6. Tìm role visitor
    # --------------------------------------------------------

    visitor_role = (
        db.query(Role)
        .filter(
            Role.name == "visitor",
        )
        .first()
    )

    if not visitor_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không tìm thấy role visitor trong hệ thống",
        )

    # --------------------------------------------------------
    # 7. Tạo User và liên kết Visitor
    # --------------------------------------------------------

    try:
        user = User(
            username=username,
            email=email,
            full_name=visitor.full_name,
            password_hash=hash_password(data.password),
            role_id=visitor_role.id,
            is_active=visitor.is_active,
        )

        db.add(user)

        # Lấy user.id trước khi commit.
        db.flush()

        visitor.user_id = user.id

        db.commit()

        db.refresh(visitor)

        return visitor

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Không thể tạo tài khoản do username hoặc email "
                "đã tồn tại hoặc dữ liệu không hợp lệ"
            ),
        )


# ============================================================
# GET VISITORS
# ADMIN / TICKET STAFF
# ============================================================

@router.get(
    "",
    response_model=list[VisitorResponse],
)
def list_visitors(
    search: str | None = Query(
        default=None,
        description="Tìm theo mã, họ tên, email hoặc số điện thoại",
    ),
    include_inactive: bool = Query(
        default=False,
        description="Bao gồm khách tham quan đã ngừng hoạt động",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "ticket_staff",
        )
    ),
):
    query = db.query(Visitor)

    if not include_inactive:
        query = query.filter(
            Visitor.is_active.is_(True),
        )

    if search:
        search_pattern = f"%{search.strip()}%"

        query = query.filter(
            (Visitor.visitor_code.ilike(search_pattern))
            | (Visitor.full_name.ilike(search_pattern))
            | (Visitor.email.ilike(search_pattern))
            | (Visitor.phone.ilike(search_pattern))
        )

    return (
        query
        .order_by(
            Visitor.id.desc(),
        )
        .all()
    )


# ============================================================
# GET VISITOR BY ID
# ADMIN / TICKET STAFF
# ============================================================

@router.get(
    "/{visitor_id}",
    response_model=VisitorResponse,
)
def get_visitor(
    visitor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "ticket_staff",
        )
    ),
):
    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.id == visitor_id,
        )
        .first()
    )

    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khách tham quan",
        )

    return visitor


# ============================================================
# UPDATE VISITOR
# ADMIN / TICKET STAFF
#
# Nếu Visitor đã có tài khoản:
# - Đồng bộ full_name -> User.full_name
# - Đồng bộ email -> User.email
# - Đồng bộ is_active -> User.is_active
# ============================================================

@router.put(
    "/{visitor_id}",
    response_model=VisitorResponse,
)
def update_visitor(
    visitor_id: int,
    data: VisitorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "ticket_staff",
        )
    ),
):
    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.id == visitor_id,
        )
        .first()
    )

    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khách tham quan",
        )

    update_data = data.model_dump(
        exclude_unset=True,
    )

    # --------------------------------------------------------
    # 1. Kiểm tra visitor_code trùng
    # --------------------------------------------------------

    if "visitor_code" in update_data:
        existing_visitor = (
            db.query(Visitor)
            .filter(
                Visitor.visitor_code
                == update_data["visitor_code"],
                Visitor.id != visitor_id,
            )
            .first()
        )

        if existing_visitor:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã khách tham quan đã tồn tại",
            )

    # --------------------------------------------------------
    # 2. Nếu Visitor có tài khoản thì kiểm tra email User
    # --------------------------------------------------------

    linked_user = None

    if visitor.user_id:
        linked_user = (
            db.query(User)
            .filter(
                User.id == visitor.user_id,
            )
            .first()
        )

    if linked_user and "email" in update_data:
        new_email = update_data["email"]

        if new_email:
            new_email = new_email.strip()

            existing_email = (
                db.query(User)
                .filter(
                    User.email == new_email,
                    User.id != linked_user.id,
                )
                .first()
            )

            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email tài khoản đã tồn tại",
                )

            update_data["email"] = new_email

    # --------------------------------------------------------
    # 3. Cập nhật Visitor
    # --------------------------------------------------------

    for field, value in update_data.items():
        setattr(
            visitor,
            field,
            value,
        )

    # --------------------------------------------------------
    # 4. Đồng bộ User nếu Visitor có tài khoản
    # --------------------------------------------------------

    if linked_user:
        if "full_name" in update_data:
            linked_user.full_name = update_data["full_name"]

        if "email" in update_data:
            linked_user.email = update_data["email"]

        if "is_active" in update_data:
            linked_user.is_active = update_data["is_active"]

    # --------------------------------------------------------
    # 5. Commit
    # --------------------------------------------------------

    try:
        db.commit()
        db.refresh(visitor)

        return visitor

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Không thể cập nhật khách tham quan "
                "do dữ liệu bị trùng hoặc không hợp lệ"
            ),
        )


# ============================================================
# DELETE / DEACTIVATE VISITOR
# ADMIN
#
# Soft delete:
# - Không xóa bản ghi khỏi database.
# - Giữ lại lịch sử vé / phản hồi.
# - Chuyển is_active = False.
#
# Nếu Visitor có tài khoản:
# - Đồng thời khóa User.
# ============================================================

@router.delete(
    "/{visitor_id}",
    response_model=VisitorResponse,
)
def delete_visitor(
    visitor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    ),
):
    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.id == visitor_id,
        )
        .first()
    )

    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khách tham quan",
        )

    visitor.is_active = False

    # --------------------------------------------------------
    # Nếu Visitor có tài khoản -> khóa tài khoản
    # --------------------------------------------------------

    if visitor.user_id:
        linked_user = (
            db.query(User)
            .filter(
                User.id == visitor.user_id,
            )
            .first()
        )

        if linked_user:
            linked_user.is_active = False

    # --------------------------------------------------------
    # Commit
    # --------------------------------------------------------

    try:
        db.commit()
        db.refresh(visitor)

        return visitor

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể ngừng hoạt động khách tham quan",
        )