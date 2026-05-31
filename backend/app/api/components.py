from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID
from ..core.database import get_db
from ..models.models import Component, ComponentRevision, Project, ProjectMember, User
from ..schemas.component import Component as ComponentSchema, ComponentCreate, ComponentUpdate, ComponentRevision as ComponentRevisionSchema, ComponentRevisionCreate, ComponentRevisionListItem
from .deps import get_current_user

router = APIRouter(prefix="/components", tags=["components"])

def _get_project_id_from_header(x_project_id: Optional[str] = Header(None, alias="X-Project-ID")) -> Optional[UUID]:
    if x_project_id:
        try:
            return UUID(x_project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid X-Project-ID header")
    return None

async def _verify_project_access(db: AsyncSession, project_id: UUID, user: User):
    if not project_id:
        return
    member_result = await db.execute(
        select(ProjectMember).where(ProjectMember.project_id == project_id, ProjectMember.user_id == user.id)
    )
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    member = member_result.scalar_one_or_none()
    if not member and project.created_by != user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this project")

@router.get("/", response_model=List[ComponentSchema])
async def list_components(
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    result = await db.execute(select(Component).where(Component.project_id == project_id))
    return result.scalars().all()

@router.post("/", response_model=ComponentSchema, status_code=status.HTTP_201_CREATED)
async def create_component(
    component_in: ComponentCreate,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    # Ensure unique name within project
    existing = await db.execute(select(Component).where(Component.project_id == project_id, Component.name == component_in.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Component name already exists in this project")
    component = Component(
        project_id=project_id,
        name=component_in.name,
        type=component_in.type,
        default_props=component_in.default_props,
        created_by=current_user.id,
    )
    db.add(component)
    await db.commit()
    await db.refresh(component)
    return component

@router.get("/{component_id}", response_model=ComponentSchema)
async def get_component(
    component_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    component = await db.get(Component, component_id)
    if not component or component.project_id != project_id:
        raise HTTPException(status_code=404, detail="Component not found")
    return component

@router.put("/{component_id}", response_model=ComponentSchema)
async def update_component(
    component_id: UUID,
    component_in: ComponentUpdate,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    component = await db.get(Component, component_id)
    if not component or component.project_id != project_id:
        raise HTTPException(status_code=404, detail="Component not found")
    update_data = component_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(component, field, value)
    db.add(component)
    await db.commit()
    await db.refresh(component)
    return component

@router.delete("/{component_id}")
async def delete_component(
    component_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    component = await db.get(Component, component_id)
    if not component or component.project_id != project_id:
        raise HTTPException(status_code=404, detail="Component not found")
    await db.delete(component)
    await db.commit()
    return {"message": "Component deleted"}


# --- Component Revisions ---

@router.get("/{component_id}/revisions", response_model=List[ComponentRevisionListItem])
async def list_component_revisions(
    component_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all revisions for a component"""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    component = await db.get(Component, component_id)
    if not component or component.project_id != project_id:
        raise HTTPException(status_code=404, detail="Component not found")

    result = await db.execute(
        select(ComponentRevision).where(ComponentRevision.component_id == component_id).order_by(ComponentRevision.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{component_id}/revisions", response_model=ComponentRevisionSchema, status_code=201)
async def create_component_revision(
    component_id: UUID,
    rev_in: ComponentRevisionCreate,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new revision snapshot for a component"""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    component = await db.get(Component, component_id)
    if not component or component.project_id != project_id:
        raise HTTPException(status_code=404, detail="Component not found")

    revision = ComponentRevision(
        component_id=component_id,
        default_props=rev_in.default_props or component.default_props,
        name=rev_in.name or component.name,
        created_by=current_user.id,
    )
    db.add(revision)
    await db.commit()
    await db.refresh(revision)
    return revision


@router.get("/{component_id}/revisions/{revision_id}", response_model=ComponentRevisionSchema)
async def get_component_revision(
    component_id: UUID,
    revision_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific component revision"""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    revision = await db.get(ComponentRevision, revision_id)
    if not revision or revision.component_id != component_id:
        raise HTTPException(status_code=404, detail="Revision not found")
    return revision


@router.post("/{component_id}/revisions/{revision_id}/restore", response_model=ComponentRevisionSchema)
async def restore_component_revision(
    component_id: UUID,
    revision_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Restore a component to a previous revision"""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    component = await db.get(Component, component_id)
    if not component or component.project_id != project_id:
        raise HTTPException(status_code=404, detail="Component not found")

    revision = await db.get(ComponentRevision, revision_id)
    if not revision or revision.component_id != component_id:
        raise HTTPException(status_code=404, detail="Revision not found")

    # Save current state as a new revision first
    current_rev = ComponentRevision(
        component_id=component_id,
        default_props=component.default_props,
        name=component.name,
        created_by=current_user.id,
    )
    db.add(current_rev)

    # Restore the revision
    component.default_props = revision.default_props
    component.name = revision.name
    db.add(component)
    await db.commit()
    await db.refresh(revision)
    return revision


@router.get("/{component_id}/revisions/compare")
async def compare_component_revisions(
    component_id: UUID,
    revision_id_1: UUID,
    revision_id_2: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compare two component revisions"""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    rev1 = await db.get(ComponentRevision, revision_id_1)
    rev2 = await db.get(ComponentRevision, revision_id_2)

    if not rev1 or not rev2 or rev1.component_id != component_id or rev2.component_id != component_id:
        raise HTTPException(status_code=404, detail="Revision not found")

    # Simple diff: compare props
    def compute_diff(obj1: dict, obj2: dict, path: str = "") -> list:
        diffs = []
        all_keys = set(obj1.keys()) | set(obj2.keys())
        for key in all_keys:
            new_path = f"{path}.{key}" if path else key
            if key not in obj1:
                diffs.append({"path": new_path, "type": "added", "value": obj2[key]})
            elif key not in obj2:
                diffs.append({"path": new_path, "type": "removed", "value": obj1[key]})
            elif obj1[key] != obj2[key]:
                if isinstance(obj1[key], dict) and isinstance(obj2[key], dict):
                    diffs.extend(compute_diff(obj1[key], obj2[key], new_path))
                else:
                    diffs.append({"path": new_path, "type": "changed", "from": obj1[key], "to": obj2[key]})
        return diffs

    diff = compute_diff(rev1.default_props or {}, rev2.default_props or {})

    return {
        "revision_1": {
            "id": str(rev1.id),
            "name": rev1.name,
            "created_at": rev1.created_at.isoformat() if rev1.created_at else None
        },
        "revision_2": {
            "id": str(rev2.id),
            "name": rev2.name,
            "created_at": rev2.created_at.isoformat() if rev2.created_at else None
        },
        "diff": diff,
        "summary": {
            "added": len([d for d in diff if d.get("type") == "added"]),
            "removed": len([d for d in diff if d.get("type") == "removed"]),
            "changed": len([d for d in diff if d.get("type") == "changed"])
        }
    }
