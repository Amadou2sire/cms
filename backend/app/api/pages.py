from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID
from ..core.database import get_db
from ..models.models import Page, PageRevision, PreviewLink, User, Project, ProjectMember
from ..schemas.page import Page as PageSchema, PageCreate, PageUpdate, PreviewLink as PreviewLinkSchema, PreviewLinkCreate
from ..schemas.revision import PageRevision as PageRevisionSchema, PageRevisionCreate, PageRevisionListItem
from ..services.block_validator import validate_page_schema
from .deps import get_current_user
import uuid as uuid_module
from datetime import datetime, timezone

router = APIRouter(prefix="/pages", tags=["pages"])

def _get_project_id_from_header(x_project_id: Optional[str] = Header(None, alias="X-Project-ID")) -> Optional[UUID]:
    if x_project_id:
        try:
            return UUID(x_project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid X-Project-ID header")
    return None

async def _verify_project_access(db: AsyncSession, project_id: UUID, user: User):
    """Verify the user has access to the project."""
    if not project_id:
        return
    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user.id
        )
    )
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    member = member_result.scalar_one_or_none()
    if not member and project.created_by != user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this project")

@router.get("/preview/{token}")
async def get_preview_page(token: str, db: AsyncSession = Depends(get_db)):
    """Get a page by preview token (public endpoint, no auth required)"""
    result = await db.execute(
        select(PreviewLink).where(PreviewLink.token == token)
    )
    preview_link = result.scalar_one_or_none()

    if not preview_link:
        raise HTTPException(status_code=404, detail="Preview link not found")

    # Check if expired
    if preview_link.expires_at and preview_link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=404, detail="Preview link has expired")

    # Get the page
    page = await db.get(Page, preview_link.resource_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    return {
        "id": str(page.id),
        "project_id": str(page.project_id),
        "slug": page.slug,
        "title": page.title,
        "status": page.status,
        "is_home": page.is_home,
        "scheduled_publish_at": page.scheduled_publish_at.isoformat() if page.scheduled_publish_at else None,
        "schema": page.schema,
        "created_at": page.created_at.isoformat(),
        "updated_at": page.updated_at.isoformat(),
        "published_at": page.published_at.isoformat() if page.published_at else None,
    }


@router.get("/")
async def get_pages(
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    result = await db.execute(select(Page).where(Page.project_id == project_id))
    pages = result.scalars().all()
    # Convert UUIDs to strings
    return [
        {
            "id": str(p.id),
            "project_id": str(p.project_id),
            "slug": p.slug,
            "title": p.title,
            "status": p.status,
            "is_home": p.is_home,
            "scheduled_publish_at": p.scheduled_publish_at.isoformat() if p.scheduled_publish_at else None,
            "schema": p.schema,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
            "published_at": p.published_at.isoformat() if p.published_at else None,
        }
        for p in pages
    ]

@router.post("/")
async def create_page(
    page_in: PageCreate,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    try:
        validate_page_schema(page_in.schema.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    db_page = Page(
        project_id=project_id,
        slug=page_in.slug,
        title=page_in.title,
        status=page_in.status,
        schema=page_in.schema.model_dump(),
        created_by=current_user.id
    )
    db.add(db_page)
    await db.commit()
    await db.refresh(db_page)

    # Return dict with UUIDs converted to strings
    return {
        "id": str(db_page.id),
        "project_id": str(db_page.project_id),
        "slug": db_page.slug,
        "title": db_page.title,
        "status": db_page.status,
        "is_home": db_page.is_home,
        "scheduled_publish_at": db_page.scheduled_publish_at.isoformat() if db_page.scheduled_publish_at else None,
        "schema": db_page.schema,
        "created_at": db_page.created_at.isoformat(),
        "updated_at": db_page.updated_at.isoformat(),
        "published_at": db_page.published_at.isoformat() if db_page.published_at else None,
    }

@router.get("/{page_id}")
async def get_page(
    page_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    db_page = await db.get(Page, page_id)
    if not db_page or db_page.project_id != project_id:
        raise HTTPException(status_code=404, detail="Page not found")
    return {
        "id": str(db_page.id),
        "project_id": str(db_page.project_id),
        "slug": db_page.slug,
        "title": db_page.title,
        "status": db_page.status,
        "is_home": db_page.is_home,
        "scheduled_publish_at": db_page.scheduled_publish_at.isoformat() if db_page.scheduled_publish_at else None,
        "schema": db_page.schema,
        "created_at": db_page.created_at.isoformat(),
        "updated_at": db_page.updated_at.isoformat(),
        "published_at": db_page.published_at.isoformat() if db_page.published_at else None,
    }

@router.put("/{page_id}")
async def update_page(
    page_id: UUID,
    page_in: PageUpdate,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    db_page = await db.get(Page, page_id)
    if not db_page or db_page.project_id != project_id:
        raise HTTPException(status_code=404, detail="Page not found")

    if page_in.schema:
        try:
            validate_page_schema(page_in.schema.model_dump())
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    update_data = page_in.model_dump(exclude_unset=True)
    if "schema" in update_data:
        update_data["schema"] = page_in.schema.model_dump()

    if page_in.is_home:
        await db.execute(
            Page.__table__.update().where(Page.project_id == project_id, Page.id != page_id).values(is_home=False)
        )

    for field, value in update_data.items():
        setattr(db_page, field, value)

    db.add(db_page)
    await db.commit()
    await db.refresh(db_page)

    return {
        "id": str(db_page.id),
        "project_id": str(db_page.project_id),
        "slug": db_page.slug,
        "title": db_page.title,
        "status": db_page.status,
        "is_home": db_page.is_home,
        "scheduled_publish_at": db_page.scheduled_publish_at.isoformat() if db_page.scheduled_publish_at else None,
        "schema": db_page.schema,
        "created_at": db_page.created_at.isoformat(),
        "updated_at": db_page.updated_at.isoformat(),
        "published_at": db_page.published_at.isoformat() if db_page.published_at else None,
    }

@router.delete("/{page_id}")
async def delete_page(
    page_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    db_page = await db.get(Page, page_id)
    if not db_page or db_page.project_id != project_id:
        raise HTTPException(status_code=404, detail="Page not found")

    await db.delete(db_page)
    await db.commit()
    return {"message": "Page deleted"}

@router.patch("/{page_id}/publish")
async def publish_page(
    page_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    db_page = await db.get(Page, page_id)
    if not db_page or db_page.project_id != project_id:
        raise HTTPException(status_code=404, detail="Page not found")

    db_page.status = "published"
    db_page.published_at = datetime.now(timezone.utc)
    db.add(db_page)
    await db.commit()
    await db.refresh(db_page)

    return {
        "id": str(db_page.id),
        "project_id": str(db_page.project_id),
        "slug": db_page.slug,
        "title": db_page.title,
        "status": db_page.status,
        "is_home": db_page.is_home,
        "scheduled_publish_at": db_page.scheduled_publish_at.isoformat() if db_page.scheduled_publish_at else None,
        "schema": db_page.schema,
        "created_at": db_page.created_at.isoformat(),
        "updated_at": db_page.updated_at.isoformat(),
        "published_at": db_page.published_at.isoformat() if db_page.published_at else None,
    }

@router.get("/public/{slug}")
async def get_public_page(
    slug: str,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    result = await db.execute(select(Page).where(
        Page.slug == slug,
        Page.status == "published",
        Page.project_id == project_id
    ))
    db_page = result.scalar_one_or_none()
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found or not published")
    return {
        "id": str(db_page.id),
        "project_id": str(db_page.project_id),
        "slug": db_page.slug,
        "title": db_page.title,
        "status": db_page.status,
        "is_home": db_page.is_home,
        "scheduled_publish_at": db_page.scheduled_publish_at.isoformat() if db_page.scheduled_publish_at else None,
        "schema": db_page.schema,
        "created_at": db_page.created_at.isoformat(),
        "updated_at": db_page.updated_at.isoformat(),
        "published_at": db_page.published_at.isoformat() if db_page.published_at else None,
    }

# --- Revisions ---

@router.get("/{page_id}/revisions", response_model=List[PageRevisionListItem])
async def list_revisions(
    page_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    db_page = await db.get(Page, page_id)
    if not db_page or db_page.project_id != project_id:
        raise HTTPException(status_code=404, detail="Page not found")

    result = await db.execute(
        select(PageRevision).where(PageRevision.page_id == page_id).order_by(PageRevision.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{page_id}/revisions", response_model=PageRevisionSchema, status_code=201)
async def create_revision(
    page_id: UUID,
    rev_in: PageRevisionCreate,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    db_page = await db.get(Page, page_id)
    if not db_page or db_page.project_id != project_id:
        raise HTTPException(status_code=404, detail="Page not found")

    revision = PageRevision(
        page_id=page_id,
        schema=db_page.schema,
        title=rev_in.title or db_page.title,
        created_by=current_user.id,
    )
    db.add(revision)
    await db.commit()
    await db.refresh(revision)
    return revision


@router.get("/{page_id}/revisions/{revision_id}", response_model=PageRevisionSchema)
async def get_revision(
    page_id: UUID,
    revision_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    revision = await db.get(PageRevision, revision_id)
    if not revision or revision.page_id != page_id:
        raise HTTPException(status_code=404, detail="Revision not found")
    return revision


@router.get("/{page_id}/revisions/compare")
async def compare_revisions(
    page_id: UUID,
    revision_id_1: UUID,
    revision_id_2: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Compare two revisions and return the diff"""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    rev1 = await db.get(PageRevision, revision_id_1)
    rev2 = await db.get(PageRevision, revision_id_2)

    if not rev1 or not rev2 or rev1.page_id != page_id or rev2.page_id != page_id:
        raise HTTPException(status_code=404, detail="Revision not found")

    # Simple diff: compare block by block
    def compute_diff(schema1: dict, schema2: dict, path: str = "root") -> list:
        """Compute differences between two schema objects"""
        diffs = []

        if isinstance(schema1, dict) and isinstance(schema2, dict):
            all_keys = set(schema1.keys()) | set(schema2.keys())
            for key in all_keys:
                new_path = f"{path}.{key}"
                if key not in schema1:
                    diffs.append({"path": new_path, "type": "added", "value": schema2[key]})
                elif key not in schema2:
                    diffs.append({"path": new_path, "type": "removed", "value": schema1[key]})
                elif schema1[key] != schema2[key]:
                    if isinstance(schema1[key], dict) and isinstance(schema2[key], dict):
                        diffs.extend(compute_diff(schema1[key], schema2[key], new_path))
                    elif isinstance(schema1[key], list) and isinstance(schema2[key], list):
                        # Compare list items (e.g., blocks)
                        for i, (item1, item2) in enumerate(zip(schema1[key], schema2[key])):
                            if item1 != item2:
                                diffs.extend(compute_diff(item1, item2, f"{path}[{i}]"))
                        if len(schema1[key]) != len(schema2[key]):
                            diffs.append({
                                "path": new_path,
                                "type": "length_changed",
                                "from": len(schema1[key]),
                                "to": len(schema2[key])
                            })
                    else:
                        diffs.append({"path": new_path, "type": "changed", "from": schema1[key], "to": schema2[key]})
        return diffs

    diff = compute_diff(rev1.schema or {}, rev2.schema or {})

    return {
        "revision_1": {
            "id": str(rev1.id),
            "title": rev1.title,
            "created_at": rev1.created_at.isoformat() if rev1.created_at else None
        },
        "revision_2": {
            "id": str(rev2.id),
            "title": rev2.title,
            "created_at": rev2.created_at.isoformat() if rev2.created_at else None
        },
        "diff": diff,
        "summary": {
            "added": len([d for d in diff if d.get("type") == "added"]),
            "removed": len([d for d in diff if d.get("type") == "removed"]),
            "changed": len([d for d in diff if d.get("type") == "changed"])
        }
    }


@router.post("/{page_id}/revisions/{revision_id}/restore", response_model=PageRevisionSchema)
async def restore_revision(
    page_id: UUID,
    revision_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    db_page = await db.get(Page, page_id)
    if not db_page or db_page.project_id != project_id:
        raise HTTPException(status_code=404, detail="Page not found")
    revision = await db.get(PageRevision, revision_id)
    if not revision or revision.page_id != page_id:
        raise HTTPException(status_code=404, detail="Revision not found")

    # Save current state as a new revision first
    current_rev = PageRevision(
        page_id=page_id,
        schema=db_page.schema,
        title=db_page.title,
        created_by=current_user.id,
    )
    db.add(current_rev)

    # Restore the revision
    db_page.schema = revision.schema
    db.add(db_page)
    await db.commit()
    await db.refresh(revision)
    return revision


@router.get("/public/site/home")
async def get_home_page(
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    result = await db.execute(select(Page).where(
        Page.is_home == True,
        Page.status == "published",
        Page.project_id == project_id
    ))
    db_page = result.scalar_one_or_none()
    if not db_page:
        raise HTTPException(status_code=404, detail="Home page not found")
    return {
        "id": str(db_page.id),
        "project_id": str(db_page.project_id),
        "slug": db_page.slug,
        "title": db_page.title,
        "status": db_page.status,
        "is_home": db_page.is_home,
        "scheduled_publish_at": db_page.scheduled_publish_at.isoformat() if db_page.scheduled_publish_at else None,
        "schema": db_page.schema,
        "created_at": db_page.created_at.isoformat(),
        "updated_at": db_page.updated_at.isoformat(),
        "published_at": db_page.published_at.isoformat() if db_page.published_at else None,
    }


# --- Preview Links ---

@router.post("/{page_id}/preview-links", response_model=PreviewLinkSchema, status_code=201)
async def create_preview_link(
    page_id: UUID,
    preview_in: PreviewLinkCreate,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a preview link for a draft page"""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    db_page = await db.get(Page, page_id)
    if not db_page or db_page.project_id != project_id:
        raise HTTPException(status_code=404, detail="Page not found")

    token = str(uuid_module.uuid4())
    preview_link = PreviewLink(
        project_id=project_id,
        resource_type="page",
        resource_id=page_id,
        token=token,
        expires_at=preview_in.expires_at,
        created_by=current_user.id,
    )
    db.add(preview_link)
    await db.commit()
    await db.refresh(preview_link)
    return preview_link


@router.get("/{page_id}/preview-links", response_model=List[PreviewLinkSchema])
async def list_preview_links(
    page_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all preview links for a page"""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    db_page = await db.get(Page, page_id)
    if not db_page or db_page.project_id != project_id:
        raise HTTPException(status_code=404, detail="Page not found")

    result = await db.execute(
        select(PreviewLink).where(
            PreviewLink.resource_type == "page",
            PreviewLink.resource_id == page_id,
            PreviewLink.project_id == project_id
        ).order_by(PreviewLink.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/preview-links/{token}")
async def delete_preview_link(
    token: str,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a preview link"""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    preview_link = await db.execute(
        select(PreviewLink).where(
            PreviewLink.token == token,
            PreviewLink.project_id == project_id
        )
    ).first()

    if not preview_link:
        raise HTTPException(status_code=404, detail="Preview link not found")

    await db.delete(preview_link[0])
    await db.commit()
    return {"message": "Preview link deleted"}


@router.post("/{page_id}/schedule-publish")
async def schedule_publish(
    page_id: UUID,
    schedule:dict,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Schedule a page for automatic publishing at a specific date/time"""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    db_page = await db.get(Page, page_id)
    if not db_page or db_page.project_id != project_id:
        raise HTTPException(status_code=404, detail="Page not found")

    from datetime import datetime
    scheduled_at = datetime.fromisoformat(schedule.get("scheduled_at").replace("Z", "+00:00"))

    db_page.status = "scheduled"
    db_page.scheduled_publish_at = scheduled_at
    db.add(db_page)
    await db.commit()
    await db.refresh(db_page)

    return {
        "message": "Page scheduled for publishing",
        "scheduled_at": scheduled_at.isoformat()
    }
