from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, Any
from ..core.database import get_db
from ..models.models import SiteSettings, User
from .deps import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/")
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SiteSettings))
    settings = result.scalars().first()
    if not settings:
        # Create default settings if not exists
        settings = SiteSettings(
            header_config={
                "logo": "https://via.placeholder.com/150x50?text=LOGO",
                "logoHeight": "40px",
                "bg": "#ffffff",
                "menuItems": [
                    {"label": "Accueil", "href": "/", "children": []}
                ],
                "buttonLabel": "Contact",
                "buttonHref": "/contact"
            },
            footer_config={
                "logo": "https://via.placeholder.com/150x50?text=LOGO",
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(SiteSettings))
    settings = result.scalars().first()
    if not settings:
        settings = SiteSettings(header_config=config)
        db.add(settings)
    else:
        settings.header_config = config
    
    await db.commit()
    await db.refresh(settings)
    return settings

@router.put("/footer")
async def update_footer(
    config: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(SiteSettings))
    settings = result.scalars().first()
    if not settings:
        settings = SiteSettings(footer_config=config, header_config={})
        db.add(settings)
    else:
        settings.footer_config = config
    
    await db.commit()
    await db.refresh(settings)
    return settings
