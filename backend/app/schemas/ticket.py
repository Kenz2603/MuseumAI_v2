from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# ============================================================
# GIÁ VÉ CỐ ĐỊNH
# ============================================================

TICKET_PRICES = {
    "normal": Decimal("50000.00"),
    "student": Decimal("25000.00"),
    "child": Decimal("10000.00"),
}


# ============================================================
# LOẠI VÉ HỢP LỆ
# ============================================================

TicketType = Literal[
    "normal",
    "student",
    "child",
]


# ============================================================
# TICKET CREATE
# Dùng cho ADMIN / TICKET STAFF
#
# Không được gửi price.
# Backend tự xác định price theo ticket_type.
# ============================================================

class TicketCreate(BaseModel):
    ticket_code: str = Field(
        min_length=1,
        max_length=50,
    )

    visitor_id: int = Field(
        gt=0,
    )

    exhibition_id: int = Field(
        gt=0,
    )

    ticket_type: TicketType

    visit_date: date

    status: str = Field(
        default="valid",
        min_length=1,
        max_length=30,
    )

    notes: str | None = Field(
        default=None,
        max_length=1000,
    )


# ============================================================
# TICKET PURCHASE
# Dùng cho người dùng mua vé
#
# Không gửi:
# - ticket_code
# - visitor_id
# - price
# - status
#
# Backend tự xử lý.
# ============================================================

class TicketPurchase(BaseModel):
    exhibition_id: int = Field(
        gt=0,
    )

    ticket_type: TicketType

    visit_date: date

    notes: str | None = Field(
        default=None,
        max_length=1000,
    )


# ============================================================
# TICKET UPDATE
#
# Không được cập nhật trực tiếp price.
# Khi thay đổi ticket_type, backend tự tính lại price.
# ============================================================

class TicketUpdate(BaseModel):
    ticket_code: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    visitor_id: int | None = Field(
        default=None,
        gt=0,
    )

    exhibition_id: int | None = Field(
        default=None,
        gt=0,
    )

    ticket_type: TicketType | None = None

    visit_date: date | None = None

    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )

    notes: str | None = Field(
        default=None,
        max_length=1000,
    )

    is_active: bool | None = None


# ============================================================
# TICKET RESPONSE
#
# price chỉ xuất hiện ở response.
# ============================================================

class TicketResponse(BaseModel):
    id: int

    ticket_code: str

    visitor_id: int

    exhibition_id: int

    ticket_type: TicketType

    price: Decimal

    visit_date: date

    status: str

    notes: str | None

    is_active: bool

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
# ============================================================
# TICKET MANAGEMENT RESPONSE
#
# Dùng cho ADMIN / TICKET STAFF.
#
# Bổ sung thông tin người mua và triển lãm
# để giao diện quản lý không phải tự ghép dữ liệu.
# ============================================================

class TicketManagementResponse(BaseModel):
    id: int

    ticket_code: str

    visitor_id: int

    visitor_name: str

    visitor_email: str | None

    exhibition_id: int

    exhibition_name: str

    ticket_type: TicketType

    price: Decimal

    visit_date: date

    status: str

    notes: str | None

    is_active: bool

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )