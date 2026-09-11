from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.sql import func

from app.core.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    ticket_code = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    visitor_id = Column(
        Integer,
        ForeignKey("visitors.id"),
        nullable=False,
        index=True,
    )

    exhibition_id = Column(
        Integer,
        ForeignKey("exhibitions.id"),
        nullable=False,
        index=True,
    )

    ticket_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    price = Column(
        Numeric(12, 2),
        nullable=False,
    )

    visit_date = Column(
        Date,
        nullable=False,
        index=True,
    )

    status = Column(
        String(30),
        nullable=False,
        default="valid",
        index=True,
    )

    notes = Column(
        String(1000),
        nullable=True,
    )

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