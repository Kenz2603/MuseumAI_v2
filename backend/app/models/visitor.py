from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.sql import func

from app.core.database import Base


class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Liên kết hồ sơ khách tham quan với tài khoản người dùng.
    # Một tài khoản chỉ có một hồ sơ Visitor.
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        unique=True,
        index=True,
    )

    # Mã khách tham quan
    visitor_code = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    # Họ và tên
    full_name = Column(
        String(255),
        nullable=False,
        index=True,
    )

    # Email
    email = Column(
        String(255),
        nullable=True,
        index=True,
    )

    # Số điện thoại
    phone = Column(
        String(30),
        nullable=True,
    )

    # Địa chỉ
    address = Column(
        String(500),
        nullable=True,
    )

    # Ghi chú
    notes = Column(
        String(1000),
        nullable=True,
    )

    # Trạng thái hoạt động
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )