from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, Any, Optional
from uuid import UUID
from ..core.database import get_db
from ..models.models import SiteSettings, User
from .deps import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])

def _get_project_id_from_header(x_project_id: Optional[str] = Header(None, alias="X-Project-ID")) -> Optional[UUID]:
    if x_project_id:
        try:
            return UUID(x_project_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid X-Project-ID header")
    return None

@router.get("/")
async def get_settings(
    project_id_header: Optional[UUID] = Depends(_get_project_id_from_header),
    project_id_query: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    project_id = project_id_header or project_id_query
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header or project_id query parameter is required")
    result = await db.execute(select(SiteSettings).where(SiteSettings.project_id == project_id))
    settings = result.scalars().first()
    if not settings:
        # Create default settings for this project
        settings = SiteSettings(
            project_id=project_id,
            header_config={
                "logo": "",
                "logoHeight": "40px",
                "bg": "#ffffff",
                "menuItems": [
                    {"label": "Accueil", "href": "/", "children": []}
                ],
                "buttonLabel": "Contact",
                "buttonHref": "/contact"
            },
            footer_config={
                "logo": "",
                "bg": "#111111",
                "textColor": "#ffffff",
                "copyright": "© 2024 Fondinor. Tous droits réservés.",
                "columns": [
                    {
                        "title": "Société",
                        "links": [
                            {"label": "À propos", "href": "#"},
                            {"label": "Expertise", "href": "#"}
                        ]
                    },
                    {
                        "title": "Support",
                        "links": [
                            {"label": "Contact", "href": "/contact"},
                            {"label": "FAQ", "href": "#"}
                        ]
                    }
                ]
            }
        )
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings

@router.put("/header")
async def update_header(
    config: Dict[str, Any],
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    result = await db.execute(select(SiteSettings).where(SiteSettings.project_id == project_id))
    settings = result.scalars().first()
    if not settings:
        settings = SiteSettings(project_id=project_id, header_config=config)
        db.add(settings)
    else:
        settings.header_config = config

    await db.commit()
    await db.refresh(settings)
    return settings

@router.put("/footer")
async def update_footer(
    config: Dict[str, Any],
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    result = await db.execute(select(SiteSettings).where(SiteSettings.project_id == project_id))
    settings = result.scalars().first()
    if not settings:
        settings = SiteSettings(project_id=project_id, footer_config=config, header_config={})
        db.add(settings)
    else:
        settings.footer_config = config

    await db.commit()
    await db.refresh(settings)
    return settings
