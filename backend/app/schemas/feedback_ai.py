from pydantic import BaseModel, Field


class FeedbackAnalysisRequest(BaseModel):
    feedback_ids: list[int] | None = Field(
        default=None,
        description=(
            "Danh sách ID feedback cần phân tích. "
            "Nếu để null thì phân tích toàn bộ feedback đang hoạt động."
        ),
        max_length=1000,
    )


class FeedbackAnalysisResult(BaseModel):
    total_feedbacks: int = Field(
        ge=0,
        description="Tổng số feedback được phân tích.",
    )

    average_rating: float = Field(
        ge=0,
        le=5,
        description="Điểm đánh giá trung bình.",
    )

    positive_count: int = Field(
        ge=0,
        description="Số feedback tích cực.",
    )

    neutral_count: int = Field(
        ge=0,
        description="Số feedback trung lập.",
    )

    negative_count: int = Field(
        ge=0,
        description="Số feedback tiêu cực.",
    )

    sentiment_summary: str = Field(
        min_length=1,
        description="Tóm tắt xu hướng cảm xúc của khách tham quan.",
    )

    positive_points: list[str] = Field(
        default_factory=list,
        description="Các điểm được khách tham quan đánh giá tích cực.",
    )

    negative_points: list[str] = Field(
        default_factory=list,
        description="Các vấn đề hoặc điểm chưa hài lòng nổi bật.",
    )

    recommendations: list[str] = Field(
        default_factory=list,
        description="Đề xuất cải thiện hoạt động bảo tàng.",
    )

    conclusion: str = Field(
        min_length=1,
        description="Kết luận tổng quan dành cho nhân viên quản lý.",
    )


class FeedbackAnalysisResponse(BaseModel):
    result: FeedbackAnalysisResult
    source: str
    data_verified: bool
    ai_fallback: bool = False