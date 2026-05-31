from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID
import secrets
import httpx
from ..core.database import get_db
from ..models.models import Webhook, WebhookDelivery, Project, ProjectMember, User
from ..schemas.webhook import Webhook as WebhookSchema, WebhookCreate, WebhookUpdate, WebhookDeliveryRead
from .deps import get_current_user
from datetime import datetime

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

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

@router.get("/", response_model=List[WebhookSchema])
async def list_webhooks(
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all webhooks for a project."""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    result = await db.execute(
        select(Webhook).where(Webhook.project_id == project_id).order_by(Webhook.created_at.desc())
    )
    return result.scalars().all()

@router.post("/", response_model=WebhookSchema, status_code=201)
async def create_webhook(
    webhook_in: WebhookCreate,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new webhook."""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    # Validate URL
    try:
        from urllib.parse import urlparse
        result = urlparse(webhook_in.url)
        if not all([result.scheme, result.netloc]):
            raise HTTPException(status_code=400, detail="Invalid URL format")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid URL: {str(e)}")

    # Generate secret for signing
    secret = secrets.token_hex(32)

    webhook = Webhook(
        project_id=project_id,
        name=webhook_in.name,
        url=webhook_in.url,
        events=webhook_in.events,
        secret=secret,
        active=webhook_in.active,
        created_by=current_user.id,
    )
    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)
    return webhook

@router.get("/{webhook_id}", response_model=WebhookSchema)
async def get_webhook(
    webhook_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific webhook."""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    webhook = await db.get(Webhook, webhook_id)
    if not webhook or webhook.project_id != project_id:
        raise HTTPException(status_code=404, detail="Webhook not found")

    return webhook

@router.put("/{webhook_id}", response_model=WebhookSchema)
async def update_webhook(
    webhook_id: UUID,
    webhook_in: WebhookUpdate,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a webhook."""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    webhook = await db.get(Webhook, webhook_id)
    if not webhook or webhook.project_id != project_id:
        raise HTTPException(status_code=404, detail="Webhook not found")

    update_data = webhook_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(webhook, field, value)

    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)
    return webhook

@router.delete("/{webhook_id}")
async def delete_webhook(
    webhook_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a webhook."""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    webhook = await db.get(Webhook, webhook_id)
    if not webhook or webhook.project_id != project_id:
        raise HTTPException(status_code=404, detail="Webhook not found")

    await db.delete(webhook)
    await db.commit()
    return {"message": "Webhook deleted"}

@router.get("/{webhook_id}/deliveries", response_model=List[WebhookDeliveryRead])
async def list_deliveries(
    webhook_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List delivery attempts for a webhook."""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)

    webhook = await db.get(Webhook, webhook_id)
    if not webhook or webhook.project_id != project_id:
        raise HTTPException(status_code=404, detail="Webhook not found")

    result = await db.execute(
        select(WebhookDelivery)
        .where(WebhookDelivery.webhook_id == webhook_id)
        .order_by(WebhookDelivery.created_at.desc())
    )
    return result.scalars().all()

# Available events list
@router.get("/events")
async def list_events():
    """List available webhook events."""
    return {
        "events": [
            {"event": "page.created", "description": "Une nouvelle page a été créée"},
            {"event": "page.updated", "description": "Une page a été mise à jour"},
            {"event": "page.published", "description": "Une page a été publiée"},
            {"event": "page.deleted", "description": "Une page a été supprimée"},
            {"event": "article.created", "description": "Un nouvel article a été créé"},
            {"event": "article.published", "description": "Un article a été publié"},
            {"event": "form.submitted", "description": "Un formulaire a été soumis"},
            {"event": "member.invited", "description": "Un membre a été invité"},
            {"event": "member.joined", "description": "Un membre a rejoint le projet"},
        ]
    }

async def send_webhook(webhook: Webhook, event_type: str, payload: dict):
    """Send a webhook delivery (async helper)."""
    import hmac
    import hashlib

    # Create signature
    timestamp = str(int(datetime.now().timestamp()))
    payload_bytes = str(payload).encode('utf-8')
    signature = hmac.new(
        webhook.secret.encode('utf-8'),
        payload_bytes + timestamp.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Timestamp": timestamp,
        "X-Webhook-Event": event_type
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(webhook.url, json=payload, headers=headers)

            # Record delivery
            delivery = WebhookDelivery(
                webhook_id=webhook.id,
                event_type=event_type,
                payload=payload,
                status_code=response.status_code,
                response_body=response.text[:1000] if response.text else None,
                success=response.status_code < 400,
            )
            async with db_async_session() as session:
                session.add(delivery)
                await session.commit()

            return response.status_code
    except Exception as e:
        # Record failed delivery
        delivery = WebhookDelivery(
            webhook_id=webhook.id,
            event_type=event_type,
            payload=payload,
            success=False,
        )
        async with db_async_session() as session:
            session.add(delivery)
            await session.commit()
        return None