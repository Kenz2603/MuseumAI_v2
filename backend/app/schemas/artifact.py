from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ArtifactBase(BaseModel):
    artifact_code: str = Field(
        min_length=1,
        max_length=50,
    )

    name: str = Field(
        min_length=1,
        max_length=255,
    )

    origin: str | None = Field(
        default=None,
        max_length=255,
    )

    period: str | None = Field(
        default=None,
        max_length=255,
    )

    material: str | None = Field(
        default=None,
        max_length=255,
    )

    description: str | None = None

    image_url: str | None = Field(
        default=None,
        max_length=500,
    )

    narration: str | None = None


class ArtifactCreate(ArtifactBase):
    pass


class ArtifactUpdate(BaseModel):
    artifact_code: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    origin: str | None = Field(
        default=None,
        max_length=255,
    )

    period: str | None = Field(
        default=None,
        max_length=255,
    )

    material: str | None = Field(
        default=None,
        max_length=255,
    )

    description: str | None = None

    image_url: str | None = Field(
        default=None,
        max_length=500,
    )

    narration: str | None = None

    is_active: bool | None = None


class ArtifactResponse(ArtifactBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class NarrationGenerateRequest(BaseModel):
    language: str = Field(
        default="vi",
        min_length=2,
        max_length=10,
        description="Ngôn ngữ thuyết minh, ví dụ: vi, en",
    )

    style: str = Field(
        default="museum",
        min_length=1,
        max_length=50,
        description="Phong cách thuyết minh",
    )

    target_audience: str = Field(
        default="general",
        min_length=1,
        max_length=50,
        description="Đối tượng người nghe",
    )

    max_length: int = Field(
        default=500,
        ge=100,
        le=3000,
        description="Độ dài tối đa của nội dung thuyết minh",
    )

    additional_instruction: str | None = Field(
        default=None,
        max_length=1000,
        description="Yêu cầu bổ sung cho AI",
    )


class NarrationGenerateResponse(BaseModel):
    artifact_id: int
    artifact_code: str
    artifact_name: str
    draft_narration: str
    is_saved: bool = False


class NarrationSaveRequest(BaseModel):
    narration: str = Field(
        min_length=1,
        max_length=10000,
        description="Nội dung thuyết minh đã được nhân viên kiểm tra và phê duyệt",
    )