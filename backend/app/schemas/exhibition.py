from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ExhibitionBase(BaseModel):
    code: str = Field(
        min_length=1,
        max_length=50,
    )

    name: str = Field(
        min_length=1,
        max_length=255,
    )

    description: str | None = None

    start_date: datetime

    end_date: datetime

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError(
                "Ngày kết thúc phải sau ngày bắt đầu"
            )

        return self


class ExhibitionCreate(ExhibitionBase):
    pass


class ExhibitionUpdate(BaseModel):
    code: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    description: str | None = None

    start_date: datetime | None = None

    end_date: datetime | None = None

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    is_active: bool | None = None


class ExhibitionResponse(ExhibitionBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
