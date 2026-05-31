from fastapi import APIRouter, Depends, HTTPException, Response, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional, Any
from uuid import UUID
from ..core.database import get_db
from ..core.redis import get_redis
from ..models.models import Page, Project, PreviewLink
import json
from ..schemas.page import Page as PageSchema

router = APIRouter(prefix="/api", tags=["public"])

@router.get("/preview/{token}", response_model=PageSchema)
async def get_preview_page(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a page preview using a private token link"""
    result = await db.execute(
        select(PreviewLink).where(PreviewLink.token == token)
    )
    preview_link = result.scalar_one_or_none()

    if not preview_link:
        raise HTTPException(status_code=404, detail="Preview link not found")

    # Check expiration
    from datetime import datetime, timezone
    if preview_link.expires_at and preview_link.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=404, detail="Preview link has expired")

    # Only allow preview for draft/scheduled pages
    if preview_link.resource_type != "page":
        raise HTTPException(status_code=400, detail="Invalid resource type for preview")

    db_page = await db.get(Page, preview_link.resource_id)
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")

    if db_page.status == "published":
        raise HTTPException(status_code=400, detail="Page is already published, use public URL")

    return db_page

@router.get("/pages/{slug}", response_model=PageSchema)
async def get_public_page(
    slug: str,
    project_id: Optional[UUID] = Query(None, description="Project ID to scope the query"),
    lang: Optional[str] = Query(None, description="Language code for rendering"),
    db: AsyncSession = Depends(get_db),
    cache: Any = Depends(get_redis)
):
    cache_key = f"page:{project_id or 'default'}:{slug}:{lang or 'default'}"
    cached_page = await cache.get(cache_key)
    if cached_page:
        return json.loads(cached_page)

    stmt = select(Page).where(Page.slug == slug, Page.status == "published")
    if project_id:
        stmt = stmt.where(Page.project_id == project_id)
    result = await db.execute(stmt)
    db_page = result.scalars().first()
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")

    # Set the requested lang in meta for frontend rendering
    if lang and db_page.schema:
        if isinstance(db_page.schema, dict):
            if "meta" not in db_page.schema:
                db_page.schema["meta"] = {}
            db_page.schema["meta"]["lang"] = lang

    page_data = PageSchema.model_validate(db_page).model_dump_json()
    await cache.setex(cache_key, 60, page_data)

    return db_page

@router.get("/pages", response_model=List[str])
async def list_public_slugs(
    project_id: Optional[UUID] = Query(None, description="Project ID to scope the query"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Page.slug).where(Page.status == "published")
    if project_id:
        stmt = stmt.where(Page.project_id == project_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/robots.txt")
async def get_robots():
    content = "User-agent: *\nAllow: /\nSitemap: /sitemap.xml"
    return Response(content=content, media_type="text/plain")

@router.get("/sitemap.xml")
async def get_sitemap(
    project_id: Optional[UUID] = Query(None, description="Project ID to scope the query"),
    db: AsyncSession = Depends(get_db)
):
    # Get published slugs
    stmt = select(Page.slug).where(Page.status == "published")
    if project_id:
        stmt = stmt.where(Page.project_id == project_id)
    result = await db.execute(stmt)
    slugs = result.scalars().all()

    # Get project languages for hreflang
    project_languages = ["fr"]
    if project_id:
        project = await db.get(Project, project_id)
        if project and project.languages:
            project_languages = project.languages

    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    for slug in slugs:
        xml += f'  <url>\n'
        for lang in project_languages:
            xml += f'    <loc>/{lang}/{slug}</loc>\n'
            xml += f'    <xhtml:link rel="alternate" hreflang="{lang}" href="/{lang}/{slug}" />\n'
        xml += f'  </url>\n'
    xml += '</urlset>'

    return Response(content=xml, media_type="application/xml")

@router.get("/llms.txt")
async def get_llms_txt(
    project_id: Optional[UUID] = Query(None, description="Project ID to scope the query"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Page).where(Page.status == "published")
    if project_id:
        stmt = stmt.where(Page.project_id == project_id)
    result = await db.execute(stmt)
    pages = result.scalars().all()

    content = "# CANVAS CMS - Site Summary\n\n"
    content += "> Generated by CANVAS CMS\n\n"
    content += "## Pages\n\n"

    for p in pages:
        geo = p.schema.get("geo", {}) if isinstance(p.schema, dict) else {}
        if geo.get("enabled", True):
            content += f"### {p.title}\n"
            content += f"{geo.get('aiSummary', 'No summary available.')}\n\n"
            facts = geo.get("aiKeyFacts", [])
            for fact in facts:
                content += f"- {fact}\n"
            content += "\n"

    return Response(content=content, media_type="text/plain")

@router.get("/llms-full.txt")
async def get_llms_full_txt(
    project_id: Optional[UUID] = Query(None, description="Project ID to scope the query"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Page).where(Page.status == "published")
    if project_id:
        stmt = stmt.where(Page.project_id == project_id)
    result = await db.execute(stmt)
    pages = result.scalars().all()

    content = "# CANVAS CMS - Full Site Context\n\n"

    for p in pages:
        geo = p.schema.get("geo", {}) if isinstance(p.schema, dict) else {}
        if geo.get("enabled", True):
            content += f"## {p.title} (/{p.slug})\n"
            content += f"Summary: {geo.get('aiSummary', '')}\n\n"
            content += "### Key Facts\n"
            for fact in geo.get("aiKeyFacts", []):
                content += f"- {fact}\n"

            faq = geo.get("contentClarity", {}).get("faqItems", [])
            if faq:
                content += "\n### FAQ\n"
                for item in faq:
                    content += f"Q: {item.get('question')}\nA: {item.get('answer')}\n\n"
            content += "---\n\n"

    return Response(content=content, media_type="text/plain")
