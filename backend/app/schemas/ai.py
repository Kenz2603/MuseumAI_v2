from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AIChatMessage(BaseModel):
    role: str = Field(
        min_length=1,
        max_length=20,
    )

    content: str = Field(
        min_length=1,
        max_length=2000,
    )


class AIChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=2000,
    )

    history: list[AIChatMessage] = Field(
        default_factory=list,
        max_length=20,
    )


class AIChatResponse(BaseModel):
    answer: str
    intent: str
    period: str
    role: str
    source: str
    data_verified: bool
    ai_fallback: bool = False

    data: dict[str, Any] | None = None
    chart: dict[str, Any] | None = None

    model_config = ConfigDict(
        from_attributes=True,
    )