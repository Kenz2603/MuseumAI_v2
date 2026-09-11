from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.exhibition import Exhibition
from app.models.user import User
from app.schemas.exhibition import (
    ExhibitionCreate,
    ExhibitionResponse,
    ExhibitionUpdate,
)

router = APIRouter(
    prefix="/api/exhibitions",
    tags=["Exhibitions"],
)


@router.post(
    "",
    response_model=ExhibitionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_exhibition(
    data: ExhibitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    existing_exhibition = (
        db.query(Exhibition)
        .filter(Exhibition.code == data.code)
        .first()
    )

    if existing_exhibition:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã cuộc triển lãm đã tồn tại",
        )

    if data.end_date <= data.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ngày kết thúc phải sau ngày bắt đầu",
        )

    exhibition = Exhibition(
        code=data.code,
        name=data.name,
        description=data.description,
        start_date=data.start_date,
        end_date=data.end_date,
        location=data.location,
        is_active=True,
    )

    db.add(exhibition)
    db.commit()
    db.refresh(exhibition)

    return exhibition


@router.get(
    "",
    response_model=list[ExhibitionResponse],
)
def list_exhibitions(
    search: str | None = Query(
        default=None,
        description="Tìm theo mã hoặc tên cuộc triển lãm",
    ),
    include_inactive: bool = Query(
        default=False,
        description="Bao gồm cuộc triển lãm đã ngừng hoạt động",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    query = db.query(Exhibition)

    if not include_inactive:
        query = query.filter(
            Exhibition.is_active.is_(True)
        )

    if search:
        search_pattern = f"%{search.strip()}%"

        query = query.filter(
            (Exhibition.code.ilike(search_pattern))
            | (Exhibition.name.ilike(search_pattern))
        )

    return (
        query
        .order_by(Exhibition.id.desc())
        .all()
    )


@router.get(
    "/{exhibition_id}",
    response_model=ExhibitionResponse,
)
def get_exhibition(
    exhibition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
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


@router.put(
    "/{exhibition_id}",
    response_model=ExhibitionResponse,
)
def update_exhibition(
    exhibition_id: int,
    data: ExhibitionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    exhibition = (
        db.query(Exhibition)
        .filter(Exhibition.id == exhibition_id)
        .first()
    )

    if not exhibition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy cuộc triển lãm",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "code" in update_data:
        existing_exhibition = (
            db.query(Exhibition)
            .filter(
                Exhibition.code == update_data["code"],
                Exhibition.id != exhibition_id,
            )
            .first()
        )

        if existing_exhibition:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã cuộc triển lãm đã tồn tại",
            )

    new_start_date = update_data.get(
        "start_date",
        exhibition.start_date,
    )

    new_end_date = update_data.get(
        "end_date",
        exhibition.end_date,
    )

    if new_end_date <= new_start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ngày kết thúc phải sau ngày bắt đầu",
        )

    for field, value in update_data.items():
        setattr(exhibition, field, value)

    db.commit()
    db.refresh(exhibition)

    return exhibition


@router.delete(
    "/{exhibition_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_exhibition(
    exhibition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    ),
):
    exhibition = (
        db.query(Exhibition)
        .filter(Exhibition.id == exhibition_id)
        .first()
    )

    if not exhibition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy cuộc triển lãm",
        )

    db.delete(exhibition)
    db.commit()