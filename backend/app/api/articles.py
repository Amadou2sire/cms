from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Union, Optional
from uuid import UUID
import re
import unicodedata
from ..core.database import get_db
from ..models.models import Article, User, Project, ProjectMember
from ..schemas.article import Article as ArticleSchema, ArticleCreate, ArticleUpdate
from .deps import get_current_user

router = APIRouter(prefix="/articles", tags=["articles"])

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


def require_admin(user: User):
    """Raise 403 if the user is not an admin."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent effectuer cette action.",
        )


def slugify(text: str) -> str:
    """Convert a string into a URL-friendly slug."""
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    text = re.sub(r'[-\s]+', '-', text)
    return text


# ── Public endpoints (no auth) ──────────────────────────────────────

@router.get("/public/", response_model=List[ArticleSchema])
async def list_published_articles(
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    lang: Optional[str] = Query(None, description="Language code for translated content"),
    db: AsyncSession = Depends(get_db)
):
    """List all published articles for a project (public, no auth required)."""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    result = await db.execute(
        select(Article)
        .where(Article.project_id == project_id)
        .where(Article.status == "published")
        .order_by(Article.created_at.desc())
    )
    articles = result.scalars().all()
    if lang:
        for article in articles:
            translations = article.translations or {}
            t = translations.get(lang, {})
            if t:
                article.title = t.get("title", article.title)
                article.content = t.get("content", article.content)
                article.meta_title = t.get("meta_title", article.meta_title)
                article.meta_description = t.get("meta_description", article.meta_description)
    return articles


@router.get("/public/{article_id}/", response_model=ArticleSchema)
async def get_published_article(
    article_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    lang: Optional[str] = Query(None, description="Language code for translated content"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single published article (public)."""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    db_article = await db.get(Article, article_id)
    if not db_article or db_article.status != "published" or db_article.project_id != project_id:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    if lang and db_article.translations:
        t = db_article.translations.get(lang, {})
        if t:
            db_article.title = t.get("title", db_article.title)
            db_article.content = t.get("content", db_article.content)
            db_article.meta_title = t.get("meta_title", db_article.meta_title)
            db_article.meta_description = t.get("meta_description", db_article.meta_description)
    return db_article


@router.get("/public/slug/{slug}/", response_model=ArticleSchema)
async def get_published_article_by_slug(
    slug: str,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    lang: Optional[str] = Query(None, description="Language code for translated content"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single published article by its slug or ID (public)."""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    result = await db.execute(
        select(Article)
        .where(Article.slug == slug, Article.project_id == project_id)
        .where(Article.status == "published")
    )
    db_article = result.scalars().first()

    if not db_article:
        try:
            uuid_obj = UUID(slug)
            db_article = await db.get(Article, uuid_obj)
            if db_article and (db_article.status != "published" or db_article.project_id != project_id):
                db_article = None
        except ValueError:
            pass

    if not db_article:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    if lang and db_article.translations:
        t = db_article.translations.get(lang, {})
        if t:
            db_article.title = t.get("title", db_article.title)
            db_article.content = t.get("content", db_article.content)
            db_article.meta_title = t.get("meta_title", db_article.meta_title)
            db_article.meta_description = t.get("meta_description", db_article.meta_description)
    return db_article


# ── Admin-only CRUD endpoints ───────────────────────────────────────

@router.get("/", response_model=List[ArticleSchema])
async def get_articles(
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all articles for a project (accessible by any logged in user)."""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    result = await db.execute(
        select(Article).where(Article.project_id == project_id).order_by(Article.created_at.desc())
    )
    return result.scalars().all()


def _build_article_from_create(article_in: ArticleCreate, project_id: UUID, user_id: UUID) -> Article:
    slug = article_in.slug or slugify(article_in.title)
    return Article(
        project_id=project_id,
        title=article_in.title,
        slug=slug,
        image_url=article_in.image_url,
        content=article_in.content,
        status=article_in.status,
        meta_title=article_in.meta_title,
        meta_description=article_in.meta_description,
        translations=article_in.translations,
        created_by=user_id,
    )


@router.post("/", response_model=ArticleSchema, status_code=status.HTTP_201_CREATED)
async def create_article(
    article_in: ArticleCreate,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new article (admin only, scoped to project)."""
    require_admin(current_user)
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    db_article = _build_article_from_create(article_in, project_id, current_user.id)
    db.add(db_article)
    await db.commit()
    await db.refresh(db_article)
    return db_article


@router.get("/{article_id}", response_model=ArticleSchema)
async def get_article(
    article_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single article (accessible by any logged in user)."""
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    db_article = await db.get(Article, article_id)
    if not db_article or db_article.project_id != project_id:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    return db_article


@router.put("/{article_id}", response_model=ArticleSchema)
async def update_article(
    article_id: UUID,
    article_in: ArticleUpdate,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an article (admin only)."""
    require_admin(current_user)
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    db_article = await db.get(Article, article_id)
    if not db_article or db_article.project_id != project_id:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    update_data = article_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_article, field, value)

    db.add(db_article)
    await db.commit()
    await db.refresh(db_article)
    return db_article


@router.delete("/{article_id}")
async def delete_article(
    article_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an article (admin only)."""
    require_admin(current_user)
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    db_article = await db.get(Article, article_id)
    if not db_article or db_article.project_id != project_id:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    await db.delete(db_article)
    await db.commit()
    return {"message": "Article supprimé"}


@router.patch("/{article_id}/publish", response_model=ArticleSchema)
async def publish_article(
    article_id: UUID,
    project_id: Optional[UUID] = Depends(_get_project_id_from_header),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Publish an article (admin only)."""
    require_admin(current_user)
    if not project_id:
        raise HTTPException(status_code=400, detail="X-Project-ID header is required")
    await _verify_project_access(db, project_id, current_user)
    db_article = await db.get(Article, article_id)
    if not db_article or db_article.project_id != project_id:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    db_article.status = "published"
    db.add(db_article)
    await db.commit()
    await db.refresh(db_article)
    return db_article
