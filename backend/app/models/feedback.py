from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)

    feedback_code = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    visitor_id = Column(
        Integer,
        ForeignKey("visitors.id"),
        nullable=True,
        index=True,
    )

    exhibition_id = Column(
        Integer,
        ForeignKey("exhibitions.id"),
        nullable=True,
        index=True,
    )

    rating = Column(
        Integer,
        nullable=False,
    )

    content = Column(
        Text,
        nullable=False,
    )

    status = Column(
        String(30),
        nullable=False,
        default="new",
        index=True,
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