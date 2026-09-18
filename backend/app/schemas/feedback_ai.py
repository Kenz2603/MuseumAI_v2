from pydantic import BaseModel, Field


class FeedbackAnalysisRequest(BaseModel):
    feedback_ids: list[int] | None = Field(
        default=None,
        description=(
            "Danh sách ID feedback cần phân tích. "
            "Nếu để null thì phân tích toàn bộ feedback đang hoạt động."
        ),
        max_length=200,
    )


class FeedbackTheme(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=200,
        description="Chủ đề thực tế xuất hiện trong feedback.",
    )

    sentiment: str = Field(
        pattern="^(positive|neutral|negative)$",
        description=(
            "Xu hướng cảm xúc của chủ đề: "
            "positive, neutral hoặc negative."
        ),
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
        description="Số feedback tích cực theo rating.",
    )

    neutral_count: int = Field(
        ge=0,
        description="Số feedback trung lập theo rating.",
    )

    negative_count: int = Field(
        ge=0,
        description="Số feedback tiêu cực theo rating.",
    )

    sentiment_summary: str = Field(
        min_length=1,
        description="Tóm tắt xu hướng cảm xúc dựa trên feedback thực tế.",
    )

    positive_points: list[str] = Field(
        default_factory=list,
        description=(
            "Các điểm tích cực có bằng chứng từ nội dung feedback "
            "hoặc rating."
        ),
        max_length=5,
    )

    negative_points: list[str] = Field(
        default_factory=list,
        description=(
            "Các vấn đề hoặc điểm chưa hài lòng có bằng chứng "
            "từ nội dung feedback."
        ),
        max_length=5,
    )

    themes: list[FeedbackTheme] = Field(
        default_factory=list,
        description=(
            "Các chủ đề thực tế xuất hiện trong feedback "
            "cùng xu hướng cảm xúc của từng chủ đề."
        ),
        max_length=10,
    )

    recommendations: list[str] = Field(
        default_factory=list,
        description=(
            "Các đề xuất cải thiện dựa trên những vấn đề "
            "thực sự xuất hiện trong feedback."
        ),
        max_length=5,
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