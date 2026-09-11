from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.artifact import Artifact
from app.models.user import User
from app.schemas.artifact import (
    ArtifactCreate,
    ArtifactResponse,
    ArtifactUpdate,
    NarrationGenerateRequest,
    NarrationGenerateResponse,
    NarrationSaveRequest,
)
from app.services.gemini_service import gemini_service

router = APIRouter(
    prefix="/api/artifacts",
    tags=["Artifacts"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_IMAGE_SIZE = 10 * 1024 * 1024


@router.post("/upload-image")
async def upload_artifact_image(
    file: UploadFile = File(...),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.",
        )

    content = await file.read()

    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kích thước ảnh không được vượt quá 10MB.",
        )

    extension = ALLOWED_IMAGE_TYPES[file.content_type]
    filename = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename

    file_path.write_bytes(content)

    return {
        "image_url": f"/uploads/{filename}",
        "filename": filename,
        "content_type": file.content_type,
        "size": len(content),
    }


@router.post(
    "",
    response_model=ArtifactResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_artifact(
    data: ArtifactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    existing_artifact = (
        db.query(Artifact)
        .filter(
            Artifact.artifact_code == data.artifact_code
        )
        .first()
    )

    if existing_artifact:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã hiện vật đã tồn tại",
        )

    artifact = Artifact(
        artifact_code=data.artifact_code,
        name=data.name,
        origin=data.origin,
        period=data.period,
        material=data.material,
        description=data.description,
        image_url=data.image_url,
        narration=data.narration,
        is_active=True,
    )

    db.add(artifact)
    db.commit()
    db.refresh(artifact)

    return artifact


@router.get(
    "",
    response_model=list[ArtifactResponse],
)
def list_artifacts(
    search: str | None = Query(
        default=None,
        description="Tìm theo mã hoặc tên hiện vật",
    ),
    include_inactive: bool = Query(
        default=False,
        description="Bao gồm hiện vật đã ngừng hoạt động",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    query = db.query(Artifact)

    if not include_inactive:
        query = query.filter(
            Artifact.is_active.is_(True)
        )

    if search:
        search_pattern = f"%{search.strip()}%"

        query = query.filter(
            (Artifact.artifact_code.ilike(search_pattern))
            | (Artifact.name.ilike(search_pattern))
        )

    return (
        query
        .order_by(Artifact.id.desc())
        .all()
    )


@router.post(
    "/{artifact_id}/generate-narration",
    response_model=NarrationGenerateResponse,
)
def generate_artifact_narration(
    artifact_id: int,
    data: NarrationGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    artifact = (
        db.query(Artifact)
        .filter(
            Artifact.id == artifact_id,
            Artifact.is_active.is_(True),
        )
        .first()
    )

    if not artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hiện vật",
        )

    additional_instruction = (
        data.additional_instruction.strip()
        if data.additional_instruction
        else ""
    )

    prompt = f"""
Bạn là chuyên gia xây dựng nội dung thuyết minh cho bảo tàng.

Hãy tạo bản nháp thuyết minh cho hiện vật dưới đây.

THÔNG TIN HIỆN VẬT:
- Mã hiện vật: {artifact.artifact_code}
- Tên hiện vật: {artifact.name}
- Nguồn gốc: {artifact.origin or "Chưa có thông tin"}
- Niên đại / thời kỳ: {artifact.period or "Chưa có thông tin"}
- Chất liệu: {artifact.material or "Chưa có thông tin"}
- Mô tả: {artifact.description or "Chưa có thông tin"}

YÊU CẦU:
- Ngôn ngữ: {data.language}
- Phong cách: {data.style}
- Đối tượng người nghe: {data.target_audience}
- Độ dài tối đa: {data.max_length} từ.
- Chỉ sử dụng các thông tin được cung cấp.
- Không tự ý bịa thêm niên đại, nguồn gốc, nhân vật,
  sự kiện hoặc thông tin lịch sử.
- Nếu thông tin chưa đủ để khẳng định một chi tiết,
  không được trình bày chi tiết đó như một sự thật.
- Nội dung phải phù hợp với môi trường bảo tàng.
- Đây là BẢN NHÁP để nhân viên bảo tàng xem xét
  và phê duyệt, không phải nội dung chính thức.

YÊU CẦU BỔ SUNG CỦA NHÂN VIÊN:
{additional_instruction or "Không có"}
""".strip()

    try:
        draft_narration = gemini_service.generate_text(
            prompt,
            system_instruction=(
                "Bạn là trợ lý AI hỗ trợ nhân viên bảo tàng. "
                "Không được tự ý bịa đặt thông tin lịch sử "
                "hoặc biến suy đoán thành sự thật. "
                "Chỉ tạo nội dung dựa trên dữ liệu hiện vật "
                "được cung cấp. "
                "Luôn xem nội dung tạo ra là bản nháp cần "
                "nhân viên kiểm tra trước khi sử dụng chính thức."
            ),
            temperature=0.4,
            max_output_tokens=2048,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Không thể tạo nội dung thuyết minh bằng AI.",
        ) from exc

    return NarrationGenerateResponse(
        artifact_id=artifact.id,
        artifact_code=artifact.artifact_code,
        artifact_name=artifact.name,
        draft_narration=draft_narration,
        is_saved=False,
    )


@router.post(
    "/{artifact_id}/save-narration",
    response_model=ArtifactResponse,
)
def save_artifact_narration(
    artifact_id: int,
    data: NarrationSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    artifact = (
        db.query(Artifact)
        .filter(
            Artifact.id == artifact_id,
            Artifact.is_active.is_(True),
        )
        .first()
    )

    if not artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hiện vật",
        )

    narration = data.narration.strip()

    if not narration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nội dung thuyết minh không được để trống.",
        )

    artifact.narration = narration

    db.commit()
    db.refresh(artifact)

    return artifact


@router.get(
    "/{artifact_id}",
    response_model=ArtifactResponse,
)
def get_artifact(
    artifact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    artifact = (
        db.query(Artifact)
        .filter(
            Artifact.id == artifact_id,
            Artifact.is_active.is_(True),
        )
        .first()
    )

    if not artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hiện vật",
        )

    return artifact


@router.put(
    "/{artifact_id}",
    response_model=ArtifactResponse,
)
def update_artifact(
    artifact_id: int,
    data: ArtifactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin", "content_staff")
    ),
):
    artifact = (
        db.query(Artifact)
        .filter(Artifact.id == artifact_id)
        .first()
    )

    if not artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hiện vật",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "artifact_code" in update_data:
        existing_artifact = (
            db.query(Artifact)
            .filter(
                Artifact.artifact_code
                == update_data["artifact_code"],
                Artifact.id != artifact_id,
            )
            .first()
        )

        if existing_artifact:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã hiện vật đã tồn tại",
            )

    for field, value in update_data.items():
        setattr(artifact, field, value)

    db.commit()
    db.refresh(artifact)

    return artifact


@router.delete(
    "/{artifact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_artifact(
    artifact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("admin")
    ),
):
    artifact = (
        db.query(Artifact)
        .filter(Artifact.id == artifact_id)
        .first()
    )

    if not artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hiện vật",
        )

    db.delete(artifact)
    db.commit()