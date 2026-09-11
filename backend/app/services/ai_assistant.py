from __future__ import annotations

import os
import re
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any
from zoneinfo import ZoneInfo

from google import genai
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.artifact import Artifact
from app.models.exhibition import Exhibition
from app.models.exhibition_area import ExhibitionArea
from app.models.feedback import Feedback
from app.models.ticket import Ticket
from app.models.visitor import Visitor
from app.services.feedback_ai import (
    FeedbackAnalysisError,
    analyze_feedbacks,
)

VIETNAM_TZ = ZoneInfo("Asia/Ho_Chi_Minh")

MANAGEMENT_ROLES = {
    "admin",
    "content_staff",
    "ticket_staff",
}


class AIAssistantError(Exception):
    """Base exception for AI assistant errors."""


class AIConfigurationError(AIAssistantError):
    """Raised when Gemini is not configured correctly."""


class AIQuestionError(AIAssistantError):
    """Raised when the question cannot be processed."""


class AIAccessDeniedError(AIAssistantError):
    """Raised when the user does not have permission for the requested AI operation."""


def _get_gemini_client() -> genai.Client:
    """
    Create the Gemini client from backend configuration.

    The API key must remain on the backend.
    """
    api_key = (
        getattr(settings, "GOOGLE_API_KEY", None)
        or os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
    )

    if not api_key:
        raise AIConfigurationError(
            "Chưa cấu hình GEMINI_API_KEY hoặc GOOGLE_API_KEY."
        )

    return genai.Client(api_key=api_key)


def _get_gemini_model() -> str:
    return (
        getattr(settings, "GEMINI_MODEL", None)
        or os.getenv("GEMINI_MODEL")
        or "gemini-3.1-flash-lite"
    )


def _now_vietnam() -> datetime:
    return datetime.now(VIETNAM_TZ)


def _today() -> date:
    return _now_vietnam().date()


def _first_day_of_month(target: date) -> date:
    return target.replace(day=1)


def _first_day_of_previous_month(target: date) -> date:
    first_day = _first_day_of_month(target)
    previous_day = first_day - timedelta(days=1)
    return previous_day.replace(day=1)


def _last_day_of_previous_month(target: date) -> date:
    return _first_day_of_month(target) - timedelta(days=1)


def _money(value: Decimal | float | None) -> int:
    if value is None:
        return 0

    if isinstance(value, Decimal):
        return int(value)

    return int(Decimal(str(value)))


def _format_money(value: int) -> str:
    return f"{value:,}".replace(",", ".") + " VNĐ"


def _normalize_text(value: str) -> str:
    value = value.lower().strip()

    replacements = {
        "đ": "d",
        "Đ": "d",
    }

    for source, target in replacements.items():
        value = value.replace(source, target)

    return re.sub(r"\s+", " ", value)


def _contains_any(
    text: str,
    keywords: tuple[str, ...],
) -> bool:
    return any(keyword in text for keyword in keywords)


def _ticket_base_query(db: Session):
    """
    Revenue-related tickets.

    Cancelled tickets are excluded because they should not contribute
    to realized ticket revenue.
    """
    return db.query(Ticket).filter(
        Ticket.is_active.is_(True),
        Ticket.status.notin_(["cancelled", "canceled"]),
    )


def _count_exhibitions(db: Session) -> int:
    return (
        db.query(func.count(Exhibition.id))
        .filter(Exhibition.is_active.is_(True))
        .scalar()
        or 0
    )


def _count_artifacts(db: Session) -> int:
    return (
        db.query(func.count(Artifact.id))
        .filter(Artifact.is_active.is_(True))
        .scalar()
        or 0
    )


def _count_areas(db: Session) -> int:
    return (
        db.query(func.count(ExhibitionArea.id))
        .filter(ExhibitionArea.is_active.is_(True))
        .scalar()
        or 0
    )


def _count_visitors(db: Session) -> int:
    return (
        db.query(func.count(Visitor.id))
        .filter(Visitor.is_active.is_(True))
        .scalar()
        or 0
    )


def _count_tickets(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    query = _ticket_base_query(db)

    if start_date is not None:
        query = query.filter(Ticket.visit_date >= start_date)

    if end_date is not None:
        query = query.filter(Ticket.visit_date <= end_date)

    return (
        query.with_entities(
            func.count(Ticket.id)
        ).scalar()
        or 0
    )


def _ticket_revenue(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    query = _ticket_base_query(db)

    if start_date is not None:
        query = query.filter(Ticket.visit_date >= start_date)

    if end_date is not None:
        query = query.filter(Ticket.visit_date <= end_date)

    total = query.with_entities(
        func.coalesce(func.sum(Ticket.price), 0)
    ).scalar()

    return _money(total)


def _ticket_type_ranking(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict[str, Any]]:
    query = _ticket_base_query(db)

    if start_date is not None:
        query = query.filter(Ticket.visit_date >= start_date)

    if end_date is not None:
        query = query.filter(Ticket.visit_date <= end_date)

    rows = (
        query.with_entities(
            Ticket.ticket_type,
            func.count(Ticket.id).label("quantity"),
            func.coalesce(
                func.sum(Ticket.price),
                0,
            ).label("revenue"),
        )
        .group_by(Ticket.ticket_type)
        .order_by(func.count(Ticket.id).desc())
        .all()
    )

    return [
        {
            "ticket_type": row.ticket_type,
            "quantity": int(row.quantity),
            "revenue": _money(row.revenue),
        }
        for row in rows
    ]


def _active_exhibition_list(
    db: Session,
) -> list[dict[str, Any]]:
    today = _today()

    exhibitions = (
        db.query(Exhibition)
        .filter(
            Exhibition.is_active.is_(True),
            func.date(Exhibition.start_date) <= today,
            func.date(Exhibition.end_date) >= today,
        )
        .order_by(Exhibition.start_date.asc())
        .all()
    )

    return [
        {
            "id": exhibition.id,
            "code": exhibition.code,
            "name": exhibition.name,
            "location": exhibition.location,
            "start_date": (
                exhibition.start_date.isoformat()
                if exhibition.start_date
                else None
            ),
            "end_date": (
                exhibition.end_date.isoformat()
                if exhibition.end_date
                else None
            ),
        }
        for exhibition in exhibitions
    ]


def _recent_feedbacks(
    db: Session,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """
    Only return the minimum feedback information required
    for AI analysis.
    """
    feedbacks = (
        db.query(Feedback)
        .filter(Feedback.is_active.is_(True))
        .order_by(Feedback.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "rating": feedback.rating,
            "content": feedback.content,
            "status": getattr(feedback, "status", None),
            "created_at": (
                feedback.created_at.isoformat()
                if feedback.created_at
                else None
            ),
        }
        for feedback in feedbacks
    ]


def _detect_period(
    question: str,
) -> tuple[date | None, date | None, str]:
    """
    Determine the requested business period.

    Returns:
        start_date,
        end_date,
        period_label
    """
    normalized = _normalize_text(question)
    today = _today()

    if _contains_any(
        normalized,
        (
            "hom nay",
            "hôm nay",
        ),
    ):
        return today, today, "hôm nay"

    if _contains_any(
        normalized,
        (
            "thang nay",
            "tháng này",
        ),
    ):
        return (
            _first_day_of_month(today),
            today,
            "tháng này",
        )

    if _contains_any(
        normalized,
        (
            "thang truoc",
            "tháng trước",
            "thang qua",
            "tháng qua",
        ),
    ):
        return (
            _first_day_of_previous_month(today),
            _last_day_of_previous_month(today),
            "tháng trước",
        )

    if _contains_any(
        normalized,
        (
            "tuan nay",
            "tuần này",
        ),
    ):
        start = today - timedelta(days=today.weekday())
        return start, today, "tuần này"

    return None, None, "toàn bộ dữ liệu"


def _detect_intent(question: str) -> str:
    """
    Detect the primary business intent.

    Feedback analysis is intentionally checked before visitor count
    because questions about visitor feedback often contain the phrase
    "khách tham quan".
    """
    text = _normalize_text(question)

    # ---------------------------------------------------------
    # FEEDBACK ANALYSIS
    # ---------------------------------------------------------
    if _contains_any(
        text,
        (
            "phan hoi",
            "phản hồi",
            "danh gia khach",
            "đánh giá khách",
            "khach phan nan",
            "khách phàn nàn",
            "y kien khach",
            "ý kiến khách",
            "feedback",
            "review",
        ),
    ):
        return "feedback_analysis"

    # ---------------------------------------------------------
    # REVENUE
    # ---------------------------------------------------------
    if _contains_any(
        text,
        (
            "doanh thu",
            "thu nhap",
            "thu nhập",
            "tien ve",
            "tiền vé",
            "thu duoc",
            "thu được",
        ),
    ):
        if _contains_any(
            text,
            (
                "so voi",
                "so sanh",
                "so sánh",
                "tang",
                "giảm",
                "giam",
            ),
        ):
            return "revenue_comparison"

        return "revenue"

    # ---------------------------------------------------------
    # TICKET TYPE
    # ---------------------------------------------------------
    if _contains_any(
        text,
        (
            "loai ve",
            "loại vé",
            "ve nao ban nhieu",
            "vé nào bán nhiều",
            "ban nhieu nhat",
            "bán nhiều nhất",
        ),
    ):
        return "ticket_type"

    # ---------------------------------------------------------
    # TICKET COUNT
    # ---------------------------------------------------------
    if _contains_any(
        text,
        (
            "bao nhieu ve",
            "bao nhiêu vé",
            "so luong ve",
            "số lượng vé",
            "ve ban",
            "vé bán",
        ),
    ):
        return "ticket_count"

    # ---------------------------------------------------------
    # VISITOR COUNT
    # ---------------------------------------------------------
    if _contains_any(
        text,
        (
            "bao nhieu khach",
            "bao nhiêu khách",
            "so khach",
            "số khách",
            "khach tham quan",
            "khách tham quan",
        ),
    ):
        return "visitor_count"

    # ---------------------------------------------------------
    # EXHIBITIONS
    # ---------------------------------------------------------
    if _contains_any(
        text,
        (
            "bao nhieu trien lam",
            "bao nhiêu triển lãm",
            "so trien lam",
            "số triển lãm",
            "trien lam nao dang hoat dong",
            "triển lãm nào đang hoạt động",
        ),
    ):
        if _contains_any(
            text,
            (
                "dang hoat dong",
                "đang hoạt động",
                "hien tai",
                "hiện tại",
            ),
        ):
            return "active_exhibitions"

        return "exhibition_count"

    # ---------------------------------------------------------
    # ARTIFACT COUNT
    # ---------------------------------------------------------
    if _contains_any(
        text,
        (
            "bao nhieu hien vat",
            "bao nhiêu hiện vật",
            "so hien vat",
            "số hiện vật",
        ),
    ):
        return "artifact_count"

    # ---------------------------------------------------------
    # EXHIBITION AREA COUNT
    # ---------------------------------------------------------
    if _contains_any(
        text,
        (
            "bao nhieu khu vuc",
            "bao nhiêu khu vực",
            "so khu vuc",
            "số khu vực",
        ),
    ):
        return "area_count"

    # ---------------------------------------------------------
    # OVERVIEW
    # ---------------------------------------------------------
    if _contains_any(
        text,
        (
            "tong quan",
            "tổng quan",
            "tinh hinh bao tang",
            "tình hình bảo tàng",
            "bao tang hien nay",
            "bảo tàng hiện nay",
        ),
    ):
        return "overview"

    return "general"


def _build_context(
    db: Session,
    question: str,
    role: str,
) -> dict[str, Any]:
    """
    Build a verified business-data context.

    The role determines which sensitive business metrics
    are allowed to be exposed to Gemini.
    """
    normalized_role = (role or "").lower().strip()

    if normalized_role not in MANAGEMENT_ROLES:
        raise AIQuestionError(
            "Tài khoản không có quyền sử dụng trợ lý AI quản lý."
        )

    intent = _detect_intent(question)
    start_date, end_date, period_label = _detect_period(question)

    # Feedback chỉ được phép xem bởi Admin và Ticket Staff.
    if (
        intent == "feedback_analysis"
        and normalized_role == "content_staff"
    ):
        raise AIAccessDeniedError(
            "Bạn không có quyền xem và phân tích "
            "phản hồi khách tham quan."
        )

    context: dict[str, Any] = {
        "role": normalized_role,
        "intent": intent,
        "period": period_label,
        "generated_at": _now_vietnam().isoformat(),
        "data_source": "PostgreSQL",
    }

    # ---------------------------------------------------------
    # CONTENT STAFF
    # ---------------------------------------------------------
    if normalized_role == "content_staff":
        context["allowed_scope"] = [
            "artifacts",
            "exhibitions",
            "exhibition_areas",
        ]

        context["artifact_count"] = _count_artifacts(db)
        context["exhibition_count"] = _count_exhibitions(db)
        context["area_count"] = _count_areas(db)

        if intent == "active_exhibitions":
            context["active_exhibitions"] = (
                _active_exhibition_list(db)
            )

        return context

    # ---------------------------------------------------------
    # TICKET STAFF
    # ---------------------------------------------------------
    if normalized_role == "ticket_staff":
        context["allowed_scope"] = [
            "visitors",
            "tickets",
            "feedback",
        ]

        context["visitor_count"] = _count_visitors(db)
        context["ticket_count"] = _count_tickets(
            db,
            start_date,
            end_date,
        )

        context["ticket_type_ranking"] = _ticket_type_ranking(
            db,
            start_date,
            end_date,
        )

        context["feedbacks"] = _recent_feedbacks(db)

        # Ticket staff can see financial information because
        # ticket management includes ticket revenue operations.
        context["revenue"] = _ticket_revenue(
            db,
            start_date,
            end_date,
        )

        return context

    # ---------------------------------------------------------
    # ADMIN
    # ---------------------------------------------------------
    context["allowed_scope"] = [
        "artifacts",
        "exhibitions",
        "exhibition_areas",
        "visitors",
        "tickets",
        "feedback",
        "revenue",
    ]

    context["artifact_count"] = _count_artifacts(db)
    context["exhibition_count"] = _count_exhibitions(db)
    context["area_count"] = _count_areas(db)
    context["visitor_count"] = _count_visitors(db)

    context["ticket_count"] = _count_tickets(
        db,
        start_date,
        end_date,
    )

    context["revenue"] = _ticket_revenue(
        db,
        start_date,
        end_date,
    )

    context["ticket_type_ranking"] = _ticket_type_ranking(
        db,
        start_date,
        end_date,
    )

    if intent == "active_exhibitions":
        context["active_exhibitions"] = (
            _active_exhibition_list(db)
        )

    if intent in {"feedback_analysis", "overview"}:
        context["feedbacks"] = _recent_feedbacks(db)

    if intent == "revenue_comparison":
        today = _today()

        current_start = _first_day_of_month(today)
        current_end = today

        previous_start = _first_day_of_previous_month(today)
        previous_end = _last_day_of_previous_month(today)

        current_revenue = _ticket_revenue(
            db,
            current_start,
            current_end,
        )

        previous_revenue = _ticket_revenue(
            db,
            previous_start,
            previous_end,
        )

        difference = current_revenue - previous_revenue

        if previous_revenue == 0:
            percentage_change = None
        else:
            percentage_change = round(
                difference / previous_revenue * 100,
                2,
            )

        context["revenue_comparison"] = {
            "current_period": {
                "label": "tháng này",
                "start": current_start.isoformat(),
                "end": current_end.isoformat(),
                "revenue": current_revenue,
            },
            "previous_period": {
                "label": "tháng trước",
                "start": previous_start.isoformat(),
                "end": previous_end.isoformat(),
                "revenue": previous_revenue,
            },
            "difference": difference,
            "percentage_change": percentage_change,
        }

    return context


def _build_prompt(
    question: str,
    context: dict[str, Any],
    history: list[dict[str, str]] | None = None,
) -> str:
    history = history or []

    safe_history = history[-6:]

    history_text = "\n".join(
        f"{item.get('role', 'user')}: "
        f"{item.get('content', '')}"
        for item in safe_history
        if item.get("content")
    )

    return f"""
Bạn là trợ lý AI quản lý cho hệ thống MuseumAI.

Nhiệm vụ:

* Hỗ trợ nhân viên quản lý bảo tàng.
* Trả lời bằng tiếng Việt.
* Câu trả lời ngắn gọn, rõ ràng, có số liệu khi có.
* Không được tự bịa số liệu.
* Không được tự suy đoán số liệu ngoài context.
* Mọi số liệu nghiệp vụ phải lấy từ context PostgreSQL bên dưới.
* Nếu context không có dữ liệu cần thiết, phải nói rõ:
  "Hiện chưa có đủ dữ liệu trong hệ thống để trả lời chính xác."
* Không được tiết lộ API key, token, password hoặc thông tin xác thực.
* Không được thực hiện thao tác ghi/xóa/sửa dữ liệu.
* Chỉ hỗ trợ tra cứu và phân tích.
* Nếu người dùng yêu cầu hành động thay đổi dữ liệu, hãy nói rằng
  trợ lý AI hiện chỉ hỗ trợ tra cứu/phân tích và không tự thay đổi dữ liệu.

Quyền hiện tại:
{context.get("role")}

Phạm vi dữ liệu được phép:
{context.get("allowed_scope")}

Nguồn dữ liệu:
{context.get("data_source")}

Thời điểm tạo context:
{context.get("generated_at")}

Khoảng thời gian:
{context.get("period")}

Intent:
{context.get("intent")}

DỮ LIỆU NGHIỆP VỤ ĐÃ KIỂM CHỨNG:
{context}

LỊCH SỬ HỘI THOẠI GẦN ĐÂY:
{history_text or "(không có)"}

CÂU HỎI HIỆN TẠI:
{question}

Yêu cầu trả lời:

1. Trả lời trực tiếp câu hỏi.
2. Nếu là số liệu, đưa số liệu trước.
3. Nếu là doanh thu, định dạng tiền theo VNĐ.
4. Nếu là so sánh, nêu rõ tăng/giảm và mức chênh lệch.
5. Nếu dữ liệu không đủ, không được đoán.
"""


def _format_feedback_analysis(
    analysis: dict[str, Any],
) -> str:
    """
    Convert the structured feedback analysis into a concise
    natural-language answer for the management AI assistant.
    """
    result = analysis["result"]

    lines = [
        "### Phân tích phản hồi khách tham quan",
        "",
        f"- Tổng số phản hồi: {result.total_feedbacks}",
        (
            f"- Điểm đánh giá trung bình: "
            f"{result.average_rating:.2f}/5"
        ),
        f"- Tích cực: {result.positive_count}",
        f"- Trung lập: {result.neutral_count}",
        f"- Tiêu cực: {result.negative_count}",
        "",
        (
            f"**Xu hướng cảm xúc:** "
            f"{result.sentiment_summary}"
        ),
    ]

    if result.positive_points:
        lines.extend(
            [
                "",
                "**Điểm tích cực:**",
            ]
        )
        lines.extend(
            f"- {point}"
            for point in result.positive_points
        )

    if result.negative_points:
        lines.extend(
            [
                "",
                "**Điểm cần lưu ý:**",
            ]
        )
        lines.extend(
            f"- {point}"
            for point in result.negative_points
        )

    if result.recommendations:
        lines.extend(
            [
                "",
                "**Đề xuất:**",
            ]
        )
        lines.extend(
            f"- {recommendation}"
            for recommendation in result.recommendations
        )

    lines.extend(
        [
            "",
            f"**Kết luận:** {result.conclusion}",
        ]
    )

    if analysis.get("ai_fallback"):
        lines.extend(
            [
                "",
                (
                    "_Lưu ý: Gemini hiện không khả dụng; "
                    "hệ thống đang sử dụng cơ chế phân tích dự phòng._"
                ),
            ]
        )

    return "\n".join(lines)


def _fallback_answer(
    question: str,
    context: dict[str, Any],
) -> str:
    """
    Deterministic fallback.

    This is important because the business data must remain
    usable even when Gemini is temporarily unavailable.
    """
    intent = context.get("intent")

    if intent == "exhibition_count":
        return (
            f"Hệ thống hiện có "
            f"{context.get('exhibition_count', 0)} triển lãm đang "
            f"được kích hoạt."
        )

    if intent == "artifact_count":
        return (
            f"Hệ thống hiện có "
            f"{context.get('artifact_count', 0)} hiện vật đang "
            f"được kích hoạt."
        )

    if intent == "area_count":
        return (
            f"Hệ thống hiện có "
            f"{context.get('area_count', 0)} khu vực trưng bày "
            f"đang được kích hoạt."
        )

    if intent == "visitor_count":
        return (
            f"Hệ thống hiện có "
            f"{context.get('visitor_count', 0)} khách tham quan "
            f"đang hoạt động."
        )

    if intent == "ticket_count":
        return (
            f"{context.get('period', 'Khoảng thời gian được chọn')}: "
            f"{context.get('ticket_count', 0)} vé."
        )

    if intent == "revenue":
        revenue = context.get("revenue", 0)
        return (
            f"Doanh thu {context.get('period', 'được yêu cầu')} "
            f"là {_format_money(revenue)}."
        )

    if intent == "ticket_type":
        ranking = context.get("ticket_type_ranking", [])

        if not ranking:
            return "Chưa có dữ liệu bán vé trong khoảng thời gian này."

        top = ranking[0]

        return (
            f"Loại vé bán nhiều nhất là "
            f"'{top['ticket_type']}' với "
            f"{top['quantity']} vé."
        )

    if intent == "active_exhibitions":
        exhibitions = context.get("active_exhibitions", [])

        if not exhibitions:
            return "Hiện không có triển lãm nào đang hoạt động."

        names = ", ".join(
            item["name"]
            for item in exhibitions
        )

        return (
            f"Các triển lãm đang hoạt động: {names}."
        )

    if intent == "revenue_comparison":
        comparison = context.get(
            "revenue_comparison",
            {},
        )

        current = comparison.get(
            "current_period",
            {},
        ).get("revenue", 0)

        previous = comparison.get(
            "previous_period",
            {},
        ).get("revenue", 0)

        difference = comparison.get(
            "difference",
            0,
        )

        percentage = comparison.get(
            "percentage_change",
        )

        if difference > 0:
            direction = "tăng"
        elif difference < 0:
            direction = "giảm"
        else:
            direction = "không thay đổi"

        answer = (
            f"Doanh thu tháng này là {_format_money(current)}, "
            f"tháng trước là {_format_money(previous)}. "
            f"Doanh thu {direction} "
            f"{_format_money(abs(difference))}"
        )

        if percentage is not None:
            answer += f" ({abs(percentage)}%)."
        else:
            answer += "."

        return answer

    if intent == "feedback_analysis":
        return (
            "Hiện chưa thể tạo phân tích phản hồi. "
            "Vui lòng kiểm tra dữ liệu feedback hoặc cấu hình AI."
        )

    if intent == "overview":
        parts = []

        if "exhibition_count" in context:
            parts.append(
                f"{context['exhibition_count']} triển lãm"
            )

        if "artifact_count" in context:
            parts.append(
                f"{context['artifact_count']} hiện vật"
            )

        if "area_count" in context:
            parts.append(
                f"{context['area_count']} khu vực"
            )

        if "visitor_count" in context:
            parts.append(
                f"{context['visitor_count']} khách"
            )

        if "ticket_count" in context:
            parts.append(
                f"{context['ticket_count']} vé trong "
                f"{context['period']}"
            )

        if "revenue" in context:
            parts.append(
                f"doanh thu "
                f"{_format_money(context['revenue'])}"
            )

        if parts:
            return "Tổng quan: " + "; ".join(parts) + "."

    return (
        "Tôi đã nhận câu hỏi nhưng chưa xác định được "
        "chỉ số nghiệp vụ phù hợp. Bạn có thể hỏi về "
        "triển lãm, hiện vật, khu vực, khách, vé, "
        "doanh thu hoặc phản hồi."
    )


def ask_management_assistant(
    db: Session,
    question: str,
    role: str,
    history: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    """
    Main entry point for the management AI assistant.

    Returns:
        {
            "answer": "...",
            "intent": "...",
            "period": "...",
            "role": "...",
            "source": "postgresql+gemini"
        }
    """
    question = question.strip()

    if not question:
        raise AIQuestionError(
            "Câu hỏi không được để trống."
        )

    if len(question) > 2000:
        raise AIQuestionError(
            "Câu hỏi quá dài. Vui lòng rút gọn dưới 2000 ký tự."
        )

    normalized_role = (role or "").lower().strip()

    context = _build_context(
        db=db,
        question=question,
        role=normalized_role,
    )

    # ---------------------------------------------------------
    # FEEDBACK ANALYSIS
    # ---------------------------------------------------------
    # Feedback đã có service phân tích riêng.
    # Không gọi Gemini lần thứ hai ở AI Assistant.
    if context["intent"] == "feedback_analysis":
        try:
            analysis = analyze_feedbacks(db=db)

            return {
                "answer": _format_feedback_analysis(analysis),
                "intent": "feedback_analysis",
                "period": context["period"],
                "role": normalized_role,
                "source": analysis.get(
                    "source",
                    "postgresql",
                ),
                "data_verified": analysis.get(
                    "data_verified",
                    True,
                ),
                "ai_fallback": analysis.get(
                    "ai_fallback",
                    False,
                ),
            }

        except FeedbackAnalysisError as exc:
            raise AIQuestionError(str(exc)) from exc

    fallback = _fallback_answer(
        question=question,
        context=context,
    )

    try:
        client = _get_gemini_client()

        prompt = _build_prompt(
            question=question,
            context=context,
            history=history,
        )

        response = client.models.generate_content(
            model=_get_gemini_model(),
            contents=prompt,
        )

        answer = (response.text or "").strip()

        if not answer:
            answer = fallback

        return {
            "answer": answer,
            "intent": context["intent"],
            "period": context["period"],
            "role": normalized_role,
            "source": "postgresql+gemini",
            "data_verified": True,
        }

    except Exception:
        # Do not expose Gemini internals or credentials to the user.
        # The deterministic answer still uses verified DB data.
        return {
            "answer": fallback,
            "intent": context["intent"],
            "period": context["period"],
            "role": normalized_role,
            "source": "postgresql",
            "data_verified": True,
            "ai_fallback": True,
        }