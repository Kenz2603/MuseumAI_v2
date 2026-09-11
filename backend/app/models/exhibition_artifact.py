from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class ExhibitionArtifact(Base):
    __tablename__ = "exhibition_artifacts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    exhibition_id = Column(
        Integer,
        ForeignKey("exhibitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    artifact_id = Column(
        Integer,
        ForeignKey("artifacts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    display_order = Column(
        Integer,
        nullable=True,
    )

    notes = Column(
        String(1000),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )