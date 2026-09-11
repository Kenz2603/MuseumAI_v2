from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.exhibition import Exhibition
from app.models.feedback import Feedback
from app.models.user import User
from app.models.visitor import Visitor
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackManagementResponse,
    FeedbackResponse,
    FeedbackUpdate,
)

router = APIRouter(
    prefix="/api/feedback",
    tags=["Feedback"],
)


def generate_feedback_code(db: Session) -> str:
    last_feedback = (
        db.query(Feedback)
        .order_by(Feedback.id.desc())
        .first()
    )

    next_id = (last_feedback.id + 1) if last_feedback else 1

    return f"FB-{next_id:05d}"


@router.post(
    "",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_feedback(
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "ticket_staff",
        )
    ),
):
    if data.visitor_id is not None:
        visitor = (
            db.query(Visitor)
            .filter(
                Visitor.id == data.visitor_id,
                Visitor.is_active.is_(True),
            )
            .first()
        )

        if not visitor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy khách tham quan",
            )

    if data.exhibition_id is not None:
        exhibition = (
            db.query(Exhibition)
            .filter(
                Exhibition.id == data.exhibition_id,
                Exhibition.is_active.is_(True),
            )
            .first()
        )

        if not exhibition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy cuộc triển lãm",
            )

    feedback = Feedback(
        feedback_code=generate_feedback_code(db),
        visitor_id=data.visitor_id,
        exhibition_id=data.exhibition_id,
        rating=data.rating,
        content=data.content.strip(),
        status="new",
        is_active=True,
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return feedback


@router.get(
    "",
    response_model=list[FeedbackManagementResponse],
)
def list_feedback(
    search: str | None = Query(
        default=None,
        description="Tìm theo mã hoặc nội dung phản hồi",
    ),
    feedback_status: str | None = Query(
        default=None,
        alias="status",
        description="Lọc theo trạng thái phản hồi",
    ),
    include_inactive: bool = Query(
        default=False,
        description="Bao gồm phản hồi đã ngừng hoạt động",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "ticket_staff",
        )
    ),
):
    query = (
        db.query(
            Feedback,
            Visitor.full_name,
            Exhibition.name,
        )
        .outerjoin(
            Visitor,
            Visitor.id == Feedback.visitor_id,
        )
        .outerjoin(
            Exhibition,
            Exhibition.id == Feedback.exhibition_id,
        )
    )

    if not include_inactive:
        query = query.filter(
            Feedback.is_active.is_(True)
        )

    if search:
        search_pattern = f"%{search.strip()}%"

        query = query.filter(
            (Feedback.feedback_code.ilike(search_pattern))
            | (Feedback.content.ilike(search_pattern))
        )

    if feedback_status:
        query = query.filter(
            Feedback.status == feedback_status
        )

    rows = (
        query
        .order_by(Feedback.id.desc())
        .all()
    )

    return [
        FeedbackManagementResponse(
            id=feedback.id,
            feedback_code=feedback.feedback_code,
            visitor_id=feedback.visitor_id,
            exhibition_id=feedback.exhibition_id,
            rating=feedback.rating,
            content=feedback.content,
            status=feedback.status,
            is_active=feedback.is_active,
            created_at=feedback.created_at,
            updated_at=feedback.updated_at,
            visitor_name=visitor_name,
            exhibition_name=exhibition_name,
        )
        for feedback, visitor_name, exhibition_name in rows
    ]


@router.get(
    "/{feedback_id}",
    response_model=FeedbackManagementResponse,
)
def get_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "admin",
            "ticket_staff",
        )
    ),
):
    row = (
        db.query(
            Feedback,
            Visitor.full_name,
            Exhibition.name,
        )
        .outerjoin(
            Visitor,
            Visitor.id == Feedback.visitor_id,
        )
        .outerjoin(
            Exhibition,
            Exhibition.id == Feedback.exhibition_id,
        )
        .filter(Feedback.id == feedback_id)
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy phản hồi",
        )

    feedback, visitor_name, exhibition_name = row

    return FeedbackManagementResponse(
        id=feedback.id,
        feedback_code=feedback.feedback_code,
        visitor_id=feedback.visitor_id,
        exhibition_id=feedback.exhibition_id,
        rating=feedback.rating,
        content=feedback.content,
        status=feedback.status,
        is_active=feedback.is_active,
        created_at=feedback.created_at,
        updated_at=feedback.updated_at,
        visitor_name=visitor_name,
        exhibition_name=exhibition_name,
    )


@router.put(
    "/{feedback_id}",
    response_model=FeedbackResponse,
)
def update_feedback(
    feedback_id: int,
    data: FeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    ),
):
    feedback = (
        db.query(Feedback)
        .filter(Feedback.id == feedback_id)
        .first()
    )

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy phản hồi",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "content" in update_data:
        update_data["content"] = (
            update_data["content"].strip()
        )

    for field, value in update_data.items():
        setattr(feedback, field, value)

    db.commit()
    db.refresh(feedback)

    return feedback


@router.delete(
    "/{feedback_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    ),
):
    feedback = (
        db.query(Feedback)
        .filter(Feedback.id == feedback_id)
        .first()
    )

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy phản hồi",
        )

    feedback.is_active = False

    db.commit()