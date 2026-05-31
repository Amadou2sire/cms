from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID
from ..core.database import get_db
from ..models.models import Project, ProjectMember, User, Page, Article, SiteSettings, Media, Component, Form, FormSubmission, ProjectInvitation
from ..schemas.project import ProjectCreate, ProjectUpdate, Project as ProjectSchema, ProjectWithMembers, ProjectMemberRead, ProjectInvitationCreate, ProjectInvitation as ProjectInvitationSchema, MemberUpdate
from .deps import get_current_user
import uuid as uuid_module
import secrets
from datetime import datetime, timedelta

router = APIRouter(prefix="/projects", tags=["projects"])

# Seed templates
TEMPLATES = {
    "vitrine": {
        "name": "Site Vitrine",
        "description": "Template pour site vitrine / entreprise avec header, hero, services, contact",
        "pages": [
            {
                "title": "Accueil",
                "slug": "accueil",
                "status": "published",
                "is_home": True,
                "schema": {
                    "root": {
                        "id": "canvas-root", "type": "root", "props": {}, "children": [
                            {"id": "hdr-vit", "type": "header", "props": {}, "children": []},
                            {"id": "hero-vit", "type": "hero", "props": {}, "children": []},
                            {"id": "sec-vit", "type": "section", "props": {"bg": "#ffffff", "padding": "48px"}, "children": []},
                            {"id": "cta-vit", "type": "contact_banner", "props": {}, "children": []},
                            {"id": "ftr-vit", "type": "footer", "props": {}, "children": []},
                        ]
                    },
                    "meta": {"title": "Accueil", "description": "", "lang": "fr"}
                }
            },
            {
                "title": "Contact",
                "slug": "contact",
                "status": "published",
                "is_home": False,
                "schema": {
                    "root": {
                        "id": "canvas-root", "type": "root", "props": {}, "children": [
                            {"id": "hdr-cnt", "type": "header", "props": {}, "children": []},
                            {"id": "cnt-cnt", "type": "contact", "props": {}, "children": []},
                            {"id": "ftr-cnt", "type": "footer", "props": {}, "children": []},
                        ]
                    },
                    "meta": {"title": "Contact", "description": "", "lang": "fr"}
                }
            }
        ]
    },
    "portfolio": {
        "name": "Portfolio",
        "description": "Template portfolio / créatif avec galerie et témoignages",
        "pages": [
            {
                "title": "Accueil",
                "slug": "accueil",
                "status": "published",
                "is_home": True,
                "schema": {
                    "root": {
                        "id": "canvas-root", "type": "root", "props": {}, "children": [
                            {"id": "hdr-port", "type": "header", "props": {}, "children": []},
                            {"id": "hero-port", "type": "hero", "props": {}, "children": []},
                            {"id": "abt-port", "type": "about", "props": {}, "children": []},
                            {"id": "ftr-port", "type": "footer", "props": {}, "children": []},
                        ]
                    },
                    "meta": {"title": "Accueil", "description": "", "lang": "fr"}
                }
            }
        ]
    },
    "blog": {
        "name": "Blog",
        "description": "Template blog / actu avec articles et newsletter",
        "pages": [
            {
                "title": "Accueil",
                "slug": "accueil",
                "status": "published",
                "is_home": True,
                "schema": {
                    "root": {
                        "id": "canvas-root", "type": "root", "props": {}, "children": [
                            {"id": "hdr-blog", "type": "header", "props": {}, "children": []},
                            {"id": "hero-blog", "type": "hero", "props": {}, "children": []},
                            {"id": "news-blog", "type": "news", "props": {}, "children": []},
                            {"id": "ftr-blog", "type": "footer", "props": {}, "children": []},
                        ]
                    },
                    "meta": {"title": "Accueil", "description": "", "lang": "fr"}
                }
            }
        ]
    }
}


@router.get("/templates-public", tags=["templates"], dependencies=[])
async def list_templates_public():
    """List available project templates. Public endpoint (no auth required)."""
    return [
        {"id": key, "name": t["name"], "description": t["description"]}
        for key, t in TEMPLATES.items()
    ]


@router.get("/templates", tags=["templates"], dependencies=[])
async def list_templates():
    """List available project templates. Public endpoint."""
    return [
        {"id": key, "name": t["name"], "description": t["description"]}
        for key, t in TEMPLATES.items()
    ]


@router.post("/import/", tags=["projects"])
async def import_project(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Import a project from JSON export data."""
    data = payload.get("data", payload)
    project_data = data.get("project", {})
    if not project_data.get("name") or not project_data.get("slug"):
        raise HTTPException(status_code=400, detail="Invalid project data: name and slug required")

    existing = await db.execute(select(Project).where(Project.slug == project_data["slug"]))
    if existing.scalar_one_or_none():
        project_data["slug"] = f"{project_data['slug']}-imported-{uuid_module.uuid4().hex[:6]}"

    project = Project(
        name=project_data["name"],
        slug=project_data["slug"],
        description=project_data.get("description"),
        domain=project_data.get("domain"),
        logo_url=project_data.get("logo_url"),
        status="active",
        created_by=current_user.id,
    )
    db.add(project)
    await db.flush()

    member = ProjectMember(
        id=uuid_module.uuid4(),
        project_id=project.id,
        user_id=current_user.id,
        role="owner",
    )
    db.add(member)

    for p_data in data.get("pages", []):
        page = Page(
            project_id=project.id,
            title=p_data["title"],
            slug=p_data["slug"],
            status=p_data.get("status", "draft"),
            is_home=p_data.get("is_home", False),
            schema=p_data.get("schema", {}),
            created_by=current_user.id,
        )
        db.add(page)

    for a_data in data.get("articles", []):
        article = Article(
            project_id=project.id,
            title=a_data["title"],
            slug=a_data["slug"],
            content=a_data.get("content", ""),
            image_url=a_data.get("image_url"),
            meta_title=a_data.get("meta_title"),
            meta_description=a_data.get("meta_description"),
            category=a_data.get("category", "News"),
            status=a_data.get("status", "draft"),
            created_by=current_user.id,
        )
        db.add(article)

    for s_data in data.get("settings", []):
        settings = SiteSettings(
            project_id=project.id,
            header_config=s_data.get("header_config", {}),
            footer_config=s_data.get("footer_config", {}),
        )
        db.add(settings)

    for m_data in data.get("media", []):
        med = Media(
            project_id=project.id,
            filename=m_data["filename"],
            url=m_data["url"],
            mime_type=m_data.get("mime_type"),
            size=m_data.get("size"),
            created_by=current_user.id,
        )
        db.add(med)

    comp_id_map = {}
    for c_data in data.get("components", []):
        comp = Component(
            project_id=project.id,
            name=c_data["name"],
            type=c_data.get("type", "section"),
            default_props=c_data.get("default_props", {}),
            created_by=current_user.id,
        )
        db.add(comp)
        await db.flush()
        comp_id_map[c_data.get("_temp_id", c_data.get("name"))] = comp.id
    form_id_map = {}
    for f_data in data.get("forms", []):
        form = Form(
            project_id=project.id,
            name=f_data["name"],
            description=f_data.get("description"),
            fields=f_data.get("fields", []),
            notification_email=f_data.get("notification_email"),
            webhook_url=f_data.get("webhook_url"),
            created_by=current_user.id,
        )
        db.add(form)
        await db.flush()
        form_id_map[f_data.get("_temp_id", f_data.get("name"))] = form.id

    for sub_data in data.get("form_submissions", []):
        fid = sub_data.get("form_id")
        if fid and fid in form_id_map:
            fid = form_id_map[fid]
        else:
            continue
        submission = FormSubmission(
            form_id=fid,
            data=sub_data.get("data", {}),
            ip_address=sub_data.get("ip_address"),
            user_agent=sub_data.get("user_agent"),
        )
        db.add(submission)

    await db.commit()
    await db.refresh(project)
    return {"message": "Project imported", "project_id": str(project.id), "project": {"id": project.id, "name": project.name, "slug": project.slug}}


@router.get("/")
async def get_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all projects the current user is a member of."""
    # Get projects where user is a member
    result = await db.execute(
        select(Project).join(ProjectMember, ProjectMember.project_id == Project.id).where(
            ProjectMember.user_id == current_user.id
        )
    )
    projects = result.scalars().unique().all()

    # Also include projects the user created directly (without explicit membership)
    created_result = await db.execute(
        select(Project).where(Project.created_by == current_user.id)
    )
    created_projects = created_result.scalars().all()

    # Combine and deduplicate
    project_ids = set()
    all_projects = []
    for p in projects + created_projects:
        if p.id not in project_ids:
            project_ids.add(p.id)
            all_projects.append({
                "id": str(p.id),
                "name": p.name,
                "slug": p.slug,
                "description": p.description,
                "domain": p.domain,
                "logo_url": p.logo_url,
                "status": p.status,
                "languages": p.languages,
                "default_language": p.default_language,
                "created_by": str(p.created_by),
                "created_at": p.created_at.isoformat(),
                "updated_at": p.updated_at.isoformat(),
            })

    return all_projects


@router.post("/", response_model=ProjectSchema)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new project. Current user becomes the owner."""
    # Check slug uniqueness
    existing = await db.execute(select(Project).where(Project.slug == project_in.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Project slug already exists")

    project = Project(
        id=uuid_module.uuid4(),
        name=project_in.name,
        slug=project_in.slug,
        description=project_in.description,
        domain=project_in.domain,
        logo_url=project_in.logo_url,
        status="active",
        created_by=current_user.id
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    # Auto-add creator as owner in ProjectMember
    member = ProjectMember(
        id=uuid_module.uuid4(),
        project_id=project.id,
        user_id=current_user.id,
        role="owner"
    )
    db.add(member)
    await db.commit()

    return {
        "id": str(project.id),
        "name": project.name,
        "slug": project.slug,
        "description": project.description,
        "domain": project.domain,
        "logo_url": project.logo_url,
        "status": project.status,
        "languages": project.languages,
        "default_language": project.default_language,
        "created_by": str(project.created_by),
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
    }


@router.get("/{project_id}", response_model=ProjectWithMembers)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a project by ID."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify membership
    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        )
    )
    if not member_result.scalar_one_or_none() and project.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this project")

    # Fetch members
    members_result = await db.execute(
        select(ProjectMember).where(ProjectMember.project_id == project_id)
    )
    members = members_result.scalars().all()

    # Build response manually to avoid ORM relationship issues without configured relationships
    project_dict = {
        "id": str(project.id),
        "name": project.name,
        "slug": project.slug,
        "description": project.description,
        "domain": project.domain,
        "logo_url": project.logo_url,
        "status": project.status,
        "created_by": str(project.created_by),
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
        "members": [
            {
                "id": str(m.id),
                "project_id": str(m.project_id),
                "user_id": str(m.user_id),
                "role": m.role,
                "joined_at": m.joined_at.isoformat()
            } for m in members
        ]
    }
    return project_dict


@router.put("/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_id: UUID,
    project_in: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update project details."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify owner/admin access (also allow project creator)
    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        )
    )
    member = member_result.scalar_one_or_none()
    is_creator = project.created_by == current_user.id
    if not is_creator and (not member or member.role not in ("owner", "admin")):
        raise HTTPException(status_code=403, detail="Only project owner or admin can update")

    update_data = project_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)
    return project


@router.delete("/{project_id}")
async def delete_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a project. Only owner can delete."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify ownership
    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        )
    )
    member = member_result.scalar_one_or_none()
    if not member or member.role != "owner":
        raise HTTPException(status_code=403, detail="Only owner can delete project")

    await db.delete(project)
    await db.commit()
    return {"message": "Project deleted"}


# --- Import / Export ---

@router.get("/{project_id}/export")
async def export_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export all project data as JSON."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        )
    )
    if not member_result.scalar_one_or_none() and project.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    def serialize(rows, exclude=None):
        excluded = {"password_hash"}
        if exclude:
            excluded |= set(exclude)
        return [
            {k: (str(v) if isinstance(v, UUID) else v)
             for k, v in row.__dict__.items()
             if not k.startswith("_") and k not in excluded}
            for row in rows
        ]

    pages = (await db.execute(select(Page).where(Page.project_id == project_id))).scalars().all()
    articles = (await db.execute(select(Article).where(Article.project_id == project_id))).scalars().all()
    settings = (await db.execute(select(SiteSettings).where(SiteSettings.project_id == project_id))).scalars().all()
    media_list = (await db.execute(select(Media).where(Media.project_id == project_id))).scalars().all()
    components = (await db.execute(select(Component).where(Component.project_id == project_id))).scalars().all()

    forms = (await db.execute(select(Form).where(Form.project_id == project_id))).scalars().all()
    form_ids = [f.id for f in forms]
    submissions = []
    for fid in form_ids:
        fsubs = (await db.execute(select(FormSubmission).where(FormSubmission.form_id == fid))).scalars().all()
        submissions.extend(fsubs)

    return {
        "project": serialize([project], exclude={"created_by", "status"})[0],
        "pages": serialize(pages, exclude={"created_by", "project_id"}),
        "articles": serialize(articles, exclude={"created_by", "project_id"}),
        "settings": serialize(settings, exclude={"project_id"}),
        "media": serialize(media_list, exclude={"created_by", "project_id"}),
        "components": serialize(components, exclude={"created_by", "project_id"}),
        "forms": serialize(forms, exclude={"created_by", "project_id"}),
        "form_submissions": serialize(submissions, exclude={"form_id"}),
    }


# Seed templates and import logic moved to the top of the file to resolve routing conflicts


@router.post("/{project_id}/apply-template")
async def apply_template(
    project_id: UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Apply a template to an existing project."""
    template_id = payload.get("template_id", "")
    template = TEMPLATES.get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
    )
    if not member_result.scalar_one_or_none() and project.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    for p_data in template["pages"]:
        existing_page = await db.execute(
            select(Page).where(Page.project_id == project_id, Page.slug == p_data["slug"])
        )
        if existing_page.scalar_one_or_none():
            p_data["slug"] = f"{p_data['slug']}-{uuid_module.uuid4().hex[:4]}"

        page = Page(
            project_id=project.id,
            title=p_data["title"],
            slug=p_data["slug"],
            status=p_data.get("status", "draft"),
            is_home=p_data.get("is_home", False),
            schema=p_data.get("schema", {}),
            created_by=current_user.id,
        )
        db.add(page)

    await db.commit()
    return {"message": f"Template '{template_id}' applied"}


# --- Team Management ---

@router.get("/{project_id}/members", response_model=List[ProjectMemberRead])
async def list_project_members(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all members of a project."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify membership
    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        )
    )
    if not member_result.scalar_one_or_none() and project.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(ProjectMember).where(ProjectMember.project_id == project_id)
    )
    return result.scalars().all()


@router.post("/{project_id}/members/invite", response_model=ProjectInvitationSchema)
async def invite_to_project(
    project_id: UUID,
    invitation_in: ProjectInvitationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invite a user to a project via email."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify owner/admin access
    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        )
    )
    member = member_result.scalar_one_or_none()
    if not member or member.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Only owner or admin can invite members")

    # Check if user is already a member
    existing_member = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            # In a real app, we'd look up user by email
        )
    )

    # Create invitation token
    token = secrets.token_urlsafe(32)

    # Default expiration: 3 days
    expires_at = datetime.now() + timedelta(hours=invitation_in.expires_in_hours or 72)

    invitation = ProjectInvitation(
        project_id=project_id,
        email=invitation_in.email,
        role=invitation_in.role,
        token=token,
        status="pending",
        invited_by=current_user.id,
        expires_at=expires_at,
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    # TODO: Send email with invitation link
    # invite_link = f"{BASE_URL}/accept-invite/{token}"

    return invitation


@router.post("/invitations/{token}/accept")
async def accept_invitation(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept a project invitation."""
    result = await db.execute(
        select(ProjectInvitation).where(ProjectInvitation.token == token)
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    if invitation.status != "pending":
        raise HTTPException(status_code=400, detail="Invitation already accepted or expired")

    if invitation.expires_at and invitation.expires_at < datetime.now():
        invitation.status = "expired"
        await db.commit()
        raise HTTPException(status_code=400, detail="Invitation has expired")

    # Verify email matches current user
    # In production, check invitation.email == current_user.email

    # Add user to project
    member = ProjectMember(
        id=uuid_module.uuid4(),
        project_id=invitation.project_id,
        user_id=current_user.id,
        role=invitation.role,
    )
    db.add(member)

    invitation.status = "accepted"
    invitation.accepted_at = datetime.now()
    await db.commit()

    return {"message": "Welcome to the project!"}


@router.delete("/invitations/{token}")
async def cancel_invitation(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a project invitation."""
    result = await db.execute(
        select(ProjectInvitation).where(ProjectInvitation.token == token)
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    # Verify user is the inviter or project owner
    project_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == invitation.project_id,
            ProjectMember.user_id == current_user.id
        )
    )
    member = project_result.scalar_one_or_none()
    if not member or member.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Access denied")

    invitation.status = "cancelled"
    await db.commit()

    return {"message": "Invitation cancelled"}


@router.put("/{project_id}/members/{user_id}")
async def update_member_role(
    project_id: UUID,
    user_id: UUID,
    member_update: MemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a member's role in the project."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify owner/admin access
    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        )
    )
    member = member_result.scalar_one_or_none()
    if not member or member.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Only owner or admin can change roles")

    # Find the member to update
    target_member = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id
        )
    )
    target = target_member.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")

    target.role = member_update.role
    await db.commit()
    await db.refresh(target)

    return {"message": "Member role updated"}


@router.delete("/{project_id}/members/{user_id}")
async def remove_member(
    project_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a member from the project."""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify owner/admin access
    member_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        )
    )
    member = member_result.scalar_one_or_none()
    if not member or member.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Only owner or admin can remove members")

    # Cannot remove yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself from the project")

    target_member = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id
        )
    )
    target = target_member.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")

    await db.delete(target)
    await db.commit()

    return {"message": "Member removed from project"}



