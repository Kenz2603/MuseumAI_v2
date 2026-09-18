from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.artifact import Artifact
from app.models.exhibition import Exhibition
from app.models.ticket import Ticket
from app.models.user import User
from app.models.visitor import Visitor

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


MANAGEMENT_ROLES = {
    "admin",
    "content_staff",
    "ticket_staff",
}


@router.get("/summary")
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Kiểm tra tài khoản quản lý
    # --------------------------------------------------------

    if not current_user.role or current_user.role.name not in MANAGEMENT_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản không có quyền xem Dashboard.",
        )

    role = current_user.role.name

    # --------------------------------------------------------
    # Giá trị mặc định
    #
    # None có nghĩa là tài khoản hiện tại không có quyền
    # xem loại dữ liệu đó.
    # --------------------------------------------------------

    artifacts = None
    exhibitions = None
    visitors = None
    tickets = None

    # --------------------------------------------------------
    # Admin
    # --------------------------------------------------------

    if role == "admin":
        artifacts = db.query(Artifact).count()
        exhibitions = db.query(Exhibition).count()
        visitors = db.query(Visitor).count()
        tickets = db.query(Ticket).count()

    # --------------------------------------------------------
    # Content Staff
    # --------------------------------------------------------

    elif role == "content_staff":
        artifacts = db.query(Artifact).count()
        exhibitions = db.query(Exhibition).count()

    # --------------------------------------------------------
    # Ticket Staff
    # --------------------------------------------------------

    elif role == "ticket_staff":
        visitors = db.query(Visitor).count()
        tickets = db.query(Ticket).count()

    return {
        "role": role,
        "statistics": {
            "artifacts": artifacts,
            "exhibitions": exhibitions,
            "visitors": visitors,
            "tickets": tickets,
        },
    }