from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.exhibition_area import ExhibitionArea
from app.models.user import User
from app.schemas.exhibition_area import (
    ExhibitionAreaCreate,
    ExhibitionAreaResponse,
    ExhibitionAreaUpdate,
)

router = APIRouter(
    prefix="/api/exhibition-areas",
    tags=["Exhibition Areas"],
)


@router.post(
    "",
    response_model=ExhibitionAreaResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_exhibition_area(
    data: ExhibitionAreaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    existing_area = (
        db.query(ExhibitionArea)
        .filter(ExhibitionArea.code == data.code)
        .first()
    )

    if existing_area:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã khu vực đã tồn tại",
        )

    area = ExhibitionArea(
        code=data.code,
        name=data.name,
        description=data.description,
        location=data.location,
        is_active=True,
    )

    db.add(area)
    db.commit()
    db.refresh(area)

    return area


@router.get(
    "",
    response_model=list[ExhibitionAreaResponse],
)
def list_exhibition_areas(
    search: str | None = Query(
        default=None,
        description="Tìm theo mã hoặc tên khu vực",
    ),
    include_inactive: bool = Query(
        default=False,
        description="Bao gồm khu vực đã ngừng hoạt động",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    query = db.query(ExhibitionArea)

    if not include_inactive:
        query = query.filter(
            ExhibitionArea.is_active.is_(True)
        )

    if search:
        search_pattern = f"%{search.strip()}%"

        query = query.filter(
            (ExhibitionArea.code.ilike(search_pattern))
            | (ExhibitionArea.name.ilike(search_pattern))
        )

    return (
        query
        .order_by(ExhibitionArea.id.desc())
        .all()
    )


@router.get(
    "/{area_id}",
    response_model=ExhibitionAreaResponse,
)
def get_exhibition_area(
    area_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    area = (
        db.query(ExhibitionArea)
        .filter(ExhibitionArea.id == area_id)
        .first()
    )

    if not area:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khu vực trưng bày",
        )

    return area


@router.put(
    "/{area_id}",
    response_model=ExhibitionAreaResponse,
)
def update_exhibition_area(
    area_id: int,
    data: ExhibitionAreaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    area = (
        db.query(ExhibitionArea)
        .filter(ExhibitionArea.id == area_id)
        .first()
    )

    if not area:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khu vực trưng bày",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "code" in update_data:
        existing_area = (
            db.query(ExhibitionArea)
            .filter(
                ExhibitionArea.code == update_data["code"],
                ExhibitionArea.id != area_id,
            )
            .first()
        )

        if existing_area:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã khu vực đã tồn tại",
            )

    for field, value in update_data.items():
        setattr(area, field, value)

    db.commit()
    db.refresh(area)

    return area


@router.delete(
    "/{area_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_exhibition_area(
    area_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    ),
):
    area = (
        db.query(ExhibitionArea)
        .filter(ExhibitionArea.id == area_id)
        .first()
    )

    if not area:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khu vực trưng bày",
        )

    db.delete(area)
    db.commit()