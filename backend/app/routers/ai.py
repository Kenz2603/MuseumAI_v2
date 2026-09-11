from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user import User
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.schemas.feedback_ai import (
    FeedbackAnalysisRequest,
    FeedbackAnalysisResponse,
)
from app.services.ai_assistant import (
    AIAccessDeniedError,
    AIAssistantError,
    AIQuestionError,
    ask_management_assistant,
)
from app.services.feedback_ai import (
    FeedbackAnalysisError,
    analyze_feedbacks,
)

router = APIRouter(
    prefix="/api/ai",
    tags=["AI"],
)

MANAGEMENT_ROLES = (
    "admin",
    "content_staff",
    "ticket_staff",
)


@router.post(
    "/chat",
    response_model=AIChatResponse,
    status_code=status.HTTP_200_OK,
)
def chat(
    data: AIChatRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_roles(*MANAGEMENT_ROLES)),
    ],
) -> AIChatResponse:
    """
    Management AI assistant.

    Only management staff can use this endpoint.
    Visitor accounts are explicitly denied.
    """
    role = current_user.role.name if current_user.role else ""

    try:
        result = ask_management_assistant(
            db=db,
            question=data.message,
            role=role,
            history=[
                {
                    "role": item.role,
                    "content": item.content,
                }
                for item in data.history
            ],
        )

        return AIChatResponse(**result)

    except AIAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    except AIQuestionError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except AIAssistantError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể xử lý yêu cầu AI.",
        ) from exc


@router.post(
    "/feedback-analysis",
    response_model=FeedbackAnalysisResponse,
    status_code=status.HTTP_200_OK,
)
def feedback_analysis(
    data: FeedbackAnalysisRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_roles("admin", "ticket_staff")),
    ],
) -> FeedbackAnalysisResponse:
    """
    Phân tích feedback của khách tham quan bằng AI.

    Chỉ Admin và Ticket Staff được phép sử dụng.
    Content Staff và Visitor không được phép truy cập.
    """
    try:
        result = analyze_feedbacks(
            db=db,
            feedback_ids=data.feedback_ids,
        )

        return FeedbackAnalysisResponse(**result)

    except FeedbackAnalysisError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể phân tích phản hồi.",
        ) from exc