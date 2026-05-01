from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Union, Optional
from uuid import UUID
import re
import unicodedata
from ..core.database import get_db
from ..models.models import Article, User
from ..schemas.article import Article as ArticleSchema, ArticleCreate, ArticleUpdate
from .deps import get_current_user

router = APIRouter(prefix="/articles", tags=["articles"])


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
async def list_published_articles(db: AsyncSession = Depends(get_db)):
    """List all published articles (public, no auth required)."""
    result = await db.execute(
        select(Article)
        .where(Article.status == "published")
        .order_by(Article.created_at.desc())
    )
    return result.scalars().all()


@router.get("/public/{article_id}/", response_model=ArticleSchema)
async def get_published_article(
    article_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a single published article (public)."""
    db_article = await db.get(Article, article_id)
    if not db_article or db_article.status != "published":
        raise HTTPException(status_code=404, detail="Article non trouvé")
    return db_article


@router.get("/public/slug/{slug}/", response_model=ArticleSchema)
async def get_published_article_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a single published article by its slug or ID (public)."""
    # Try searching by slug first
    result = await db.execute(
        select(Article)
        .where(Article.slug == slug)
        .where(Article.status == "published")
    )
    db_article = result.scalars().first()
    
    # If not found by slug, try by ID (for legacy support)
    if not db_article:
        try:
            uuid_obj = UUID(slug)
            db_article = await db.get(Article, uuid_obj)
            if db_article and db_article.status != "published":
                db_article = None
        except ValueError:
            pass # Not a UUID, that's fine
            
    if not db_article:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    return db_article


# ── Admin-only CRUD endpoints ───────────────────────────────────────

@router.get("/", response_model=List[ArticleSchema])
async def get_articles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all articles (accessible by any logged in user)."""
    result = await db.execute(select(Article).order_by(Article.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=ArticleSchema, status_code=status.HTTP_201_CREATED)
async def create_article(
    article_in: ArticleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new article (admin only)."""
    require_admin(current_user)
    
    # Auto-generate slug if not provided
    slug = article_in.slug or slugify(article_in.title)
    
    db_article = Article(
        title=article_in.title,
        slug=slug,
        image_url=article_in.image_url,
        content=article_in.content,
        status=article_in.status,
        meta_title=article_in.meta_title,
        meta_description=article_in.meta_description,
        created_by=current_user.id,
    )
    db.add(db_article)
    await db.commit()
    await db.refresh(db_article)
    return db_article


@router.get("/{article_id}", response_model=ArticleSchema)
async def get_article(
    article_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single article (accessible by any logged in user)."""
    db_article = await db.get(Article, article_id)
    if not db_article:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    return db_article


@router.put("/{article_id}", response_model=ArticleSchema)
async def update_article(
    article_id: UUID,
    article_in: ArticleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an article (admin only)."""
    require_admin(current_user)
    db_article = await db.get(Article, article_id)
    if not db_article:
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an article (admin only)."""
    require_admin(current_user)
    db_article = await db.get(Article, article_id)
    if not db_article:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    await db.delete(db_article)
    await db.commit()
    return {"message": "Article supprimé"}


@router.patch("/{article_id}/publish", response_model=ArticleSchema)
async def publish_article(
    article_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Publish an article (admin only)."""
    require_admin(current_user)
    db_article = await db.get(Article, article_id)
    if not db_article:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    db_article.status = "published"
    db.add(db_article)
    await db.commit()
    await db.refresh(db_article)
    return db_article
