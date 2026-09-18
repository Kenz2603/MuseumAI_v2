from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.login_history import LoginHistory
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import LoginHistoryItem, LoginHistoryResponse

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


MANAGEMENT_ROLES = {
    "admin",
    "content_staff",
    "ticket_staff",
}


@router.get(
    "/login-history",
    response_model=LoginHistoryResponse,
)
def get_login_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # CHỈ ADMIN ĐƯỢC XEM LỊCH SỬ ĐĂNG NHẬP
    # --------------------------------------------------------

    if not current_user.role or current_user.role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới được xem lịch sử đăng nhập.",
        )

    # --------------------------------------------------------
    # Lấy lịch sử đăng nhập của tài khoản quản lý
    # --------------------------------------------------------
    #
    # Không lấy visitor.
    #
    # Kết quả gồm:
    # - admin
    # - content_staff
    # - ticket_staff
    #
    # Sắp xếp đăng nhập mới nhất trước.
    # --------------------------------------------------------

    rows = (
        db.query(
            LoginHistory.id,
            User.username,
            User.full_name,
            Role.name.label("role"),
            LoginHistory.login_at,
            LoginHistory.ip_address,
        )
        .join(User, LoginHistory.user_id == User.id)
        .join(Role, User.role_id == Role.id)
        .filter(Role.name.in_(MANAGEMENT_ROLES))
        .order_by(LoginHistory.login_at.desc())
        .all()
    )

    items = [
        LoginHistoryItem(
            id=row.id,
            username=row.username,
            full_name=row.full_name,
            role=row.role,
            login_at=row.login_at,
            ip_address=row.ip_address,
        )
        for row in rows
    ]

    return LoginHistoryResponse(
        items=items,
        total=len(items),
    )