from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FeedbackBase(BaseModel):
    rating: int = Field(ge=1, le=5)
    content: str = Field(min_length=1, max_length=5000)


class FeedbackCreate(FeedbackBase):
    visitor_id: int | None = Field(default=None, gt=0)
    exhibition_id: int | None = Field(default=None, gt=0)


class FeedbackUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    content: str | None = Field(default=None, min_length=1, max_length=5000)
    status: str | None = Field(default=None, min_length=1, max_length=30)
    is_active: bool | None = None


class FeedbackResponse(FeedbackBase):
    id: int
    feedback_code: str
    visitor_id: int | None
    exhibition_id: int | None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeedbackManagementResponse(FeedbackResponse):
    visitor_name: str | None = None
    exhibition_name: str | None = None