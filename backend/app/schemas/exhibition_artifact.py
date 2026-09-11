from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ExhibitionArtifactCreate(BaseModel):
    artifact_id: int = Field(
        gt=0,
    )

    display_order: int | None = Field(
        default=None,
        ge=1,
    )

    notes: str | None = Field(
        default=None,
        max_length=1000,
    )


class ExhibitionArtifactUpdate(BaseModel):
    display_order: int | None = Field(
        default=None,
        ge=1,
    )

    notes: str | None = Field(
        default=None,
        max_length=1000,
    )


class ExhibitionArtifactResponse(BaseModel):
    id: int
    exhibition_id: int
    artifact_id: int
    display_order: int | None
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )