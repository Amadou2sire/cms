from fastapi import APIRouter, Depends, HTTPException, Header, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID
import asyncio
import httpx
from ..core.database import get_db
from ..models.models import Form, FormSubmission, Project, ProjectMember, User
from ..schemas.form import Form as FormSchema, FormCreate, FormUpdate, FormSubmissionCreate, FormSubmission as FormSubmissionSchema
from .deps import get_current_user

router = APIRouter(prefix="/forms", tags=["forms"])

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

# Form CRUD
@router.get("/", response_model=List[FormSchema])
async def list_forms(
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    result = await db.execute(select(Form).where(Form.project_id == project_id))
    return result.scalars().all()

@router.post("/", response_model=FormSchema, status_code=status.HTTP_201_CREATED)
async def create_form(
    form_in: FormCreate,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    existing = await db.execute(select(Form).where(Form.project_id == project_id, Form.name == form_in.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Form name already exists in this project")
    form = Form(
        project_id=project_id,
        name=form_in.name,
        description=form_in.description,
        fields=[f.model_dump() for f in form_in.fields],
        notification_email=form_in.notification_email,
        webhook_url=form_in.webhook_url,
        created_by=current_user.id,
    )
    db.add(form)
    await db.commit()
    await db.refresh(form)
    return form

@router.get("/{form_id}", response_model=FormSchema)
async def get_form(
    form_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    form = await db.get(Form, form_id)
    if not form or form.project_id != project_id:
        raise HTTPException(status_code=404, detail="Form not found")
    return form

@router.put("/{form_id}", response_model=FormSchema)
async def update_form(
    form_id: UUID,
    form_in: FormUpdate,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    form = await db.get(Form, form_id)
    if not form or form.project_id != project_id:
        raise HTTPException(status_code=404, detail="Form not found")
    update_data = form_in.model_dump(exclude_unset=True)
    if "fields" in update_data and update_data["fields"] is not None:
        update_data["fields"] = [f.model_dump() if hasattr(f, 'model_dump') else f for f in update_data["fields"]]
    for field, value in update_data.items():
        setattr(form, field, value)
    db.add(form)
    await db.commit()
    await db.refresh(form)
    return form

@router.delete("/{form_id}")
async def delete_form(
    form_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    form = await db.get(Form, form_id)
    if not form or form.project_id != project_id:
        raise HTTPException(status_code=404, detail="Form not found")
    await db.delete(form)
    await db.commit()
    return {"message": "Form deleted"}

# Form Submission CRUD
@router.get("/{form_id}/submissions", response_model=List[FormSubmissionSchema])
async def list_submissions(
    form_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    form = await db.get(Form, form_id)
    if not form or form.project_id != project_id:
        raise HTTPException(status_code=404, detail="Form not found")
    result = await db.execute(select(FormSubmission).where(FormSubmission.form_id == form_id))
    return result.scalars().all()

@router.post("/{form_id}/submissions", response_model=FormSubmissionSchema, status_code=status.HTTP_201_CREATED)
async def create_submission(
    form_id: UUID,
    submission_in: FormSubmissionCreate,
    request: Request,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
):
    form = await db.get(Form, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if project_id and form.project_id != project_id:
        raise HTTPException(status_code=404, detail="Form not found")

    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")[:500] if request.headers.get("user-agent") else None

    submission = FormSubmission(
        form_id=form_id,
        data=submission_in.data,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    # Send notifications asynchronously
    asyncio.create_task(_send_notifications(form, submission_in.data))

    return submission

async def _send_notifications(form: Form, data: dict):
    """Send webhook and email notifications for form submissions."""
    # Webhook notification
    if form.webhook_url:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(form.webhook_url, json={
                    "form_name": form.name,
                    "form_id": str(form.id),
                    "data": data,
                })
        except Exception as e:
            print(f"Webhook failed for form {form.id}: {e}")

    # Email notification (basic - only if configured)
    # In production, integrate with an email service (e.g., SendGrid, SMTP)
    if form.notification_email:
        print(f"Form submission notification for {form.name}: {data}")

@router.delete("/{form_id}/submissions/{submission_id}")
async def delete_submission(
    form_id: UUID,
    submission_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    form = await db.get(Form, form_id)
    if not form or form.project_id != project_id:
        raise HTTPException(status_code=404, detail="Form not found")
    submission = await db.get(FormSubmission, submission_id)
    if not submission or submission.form_id != form_id:
        raise HTTPException(status_code=404, detail="Submission not found")
    await db.delete(submission)
    await db.commit()
    return {"message": "Submission deleted"}