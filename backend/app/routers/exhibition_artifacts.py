from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.artifact import Artifact
from app.models.exhibition import Exhibition
from app.models.exhibition_artifact import ExhibitionArtifact
from app.models.user import User
from app.schemas.exhibition_artifact import (
    ExhibitionArtifactCreate,
    ExhibitionArtifactResponse,
    ExhibitionArtifactUpdate,
)

router = APIRouter(
    prefix="/api/exhibitions/{exhibition_id}/artifacts",
    tags=["Exhibition Artifacts"],
)


def get_active_exhibition(
    exhibition_id: int,
    db: Session,
) -> Exhibition:
    exhibition = (
        db.query(Exhibition)
        .filter(
            Exhibition.id == exhibition_id,
            Exhibition.is_active.is_(True),
        )
        .first()
    )

    if not exhibition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy cuộc triển lãm",
        )

    return exhibition


@router.post(
    "",
    response_model=ExhibitionArtifactResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_artifact_to_exhibition(
    exhibition_id: int,
    data: ExhibitionArtifactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    get_active_exhibition(exhibition_id, db)

    artifact = (
        db.query(Artifact)
        .filter(
            Artifact.id == data.artifact_id,
            Artifact.is_active.is_(True),
        )
        .first()
    )

    if not artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hiện vật",
        )

    existing_relation = (
        db.query(ExhibitionArtifact)
        .filter(
            ExhibitionArtifact.exhibition_id == exhibition_id,
            ExhibitionArtifact.artifact_id == data.artifact_id,
        )
        .first()
    )

    if existing_relation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hiện vật đã có trong triển lãm",
        )

    exhibition_artifact = ExhibitionArtifact(
        exhibition_id=exhibition_id,
        artifact_id=data.artifact_id,
        display_order=data.display_order,
        notes=data.notes,
    )

    db.add(exhibition_artifact)
    db.commit()
    db.refresh(exhibition_artifact)

    return exhibition_artifact


@router.get(
    "",
    response_model=list[ExhibitionArtifactResponse],
)
def list_exhibition_artifacts(
    exhibition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    get_active_exhibition(exhibition_id, db)

    return (
        db.query(ExhibitionArtifact)
        .filter(
            ExhibitionArtifact.exhibition_id == exhibition_id
        )
        .order_by(
            ExhibitionArtifact.display_order.asc().nullslast(),
            ExhibitionArtifact.id.asc(),
        )
        .all()
    )


@router.put(
    "/{relation_id}",
    response_model=ExhibitionArtifactResponse,
)
def update_exhibition_artifact(
    exhibition_id: int,
    relation_id: int,
    data: ExhibitionArtifactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    get_active_exhibition(exhibition_id, db)

    exhibition_artifact = (
        db.query(ExhibitionArtifact)
        .filter(
            ExhibitionArtifact.id == relation_id,
            ExhibitionArtifact.exhibition_id == exhibition_id,
        )
        .first()
    )

    if not exhibition_artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hiện vật trong triển lãm",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(exhibition_artifact, field, value)

    db.commit()
    db.refresh(exhibition_artifact)

    return exhibition_artifact


@router.delete(
    "/{relation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_artifact_from_exhibition(
    exhibition_id: int,
    relation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    get_active_exhibition(exhibition_id, db)

    exhibition_artifact = (
        db.query(ExhibitionArtifact)
        .filter(
            ExhibitionArtifact.id == relation_id,
            ExhibitionArtifact.exhibition_id == exhibition_id,
        )
        .first()
    )

    if not exhibition_artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hiện vật trong triển lãm",
        )

    db.delete(exhibition_artifact)
    db.commit()