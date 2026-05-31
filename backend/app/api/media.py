from fastapi import APIRouter, UploadFile, File, HTTPException, Header, Depends
import shutil
import os
import uuid
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.database import get_db
from ..models.models import Media, User
from .deps import get_current_user

router = APIRouter(prefix="/media", tags=["media"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _get_project_id_from_header(x_project_id: Optional[str] = Header(None, alias="X-Project-ID")) -> Optional[UUID]:
    if x_project_id:
        try:
            return UUID(x_project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid X-Project-ID header")
    return None


@router.post("/upload")
async def upload_media(
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")

    if not (file.content_type.startswith("image/") or file.content_type.startswith("video/")):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image ou une vidéo")

    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Save to database
    media = Media(
        project_id=project_id,
        filename=filename,
        url=f"http://127.0.0.1:8000/uploads/{filename}",
        mime_type=file.content_type,
        created_by=current_user.id
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)

    return {"id": str(media.id), "url": media.url}
