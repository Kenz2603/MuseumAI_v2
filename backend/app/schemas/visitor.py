from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VisitorBase(BaseModel):
    visitor_code: str = Field(
        min_length=1,
        max_length=50,
    )

    full_name: str = Field(
        min_length=1,
        max_length=255,
    )

    email: str | None = Field(
        default=None,
        max_length=255,
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    address: str | None = Field(
        default=None,
        max_length=500,
    )

    notes: str | None = Field(
        default=None,
        max_length=1000,
    )


class VisitorCreate(VisitorBase):
    create_account: bool = False

    username: str | None = Field(
        default=None,
        min_length=3,
        max_length=50,
    )

    password: str | None = Field(
        default=None,
        min_length=8,
        max_length=128,
    )

class VisitorAccountCreate(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=50,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )

class VisitorUpdate(BaseModel):
    visitor_code: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    full_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    email: str | None = Field(
        default=None,
        max_length=255,
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    address: str | None = Field(
        default=None,
        max_length=500,
    )

    notes: str | None = Field(
        default=None,
        max_length=1000,
    )

    is_active: bool | None = None


class VisitorResponse(VisitorBase):
    id: int
    user_id: int | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )