from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID
from ..core.database import get_db
from ..models.models import Page, User
from ..schemas.page import Page as PageSchema, PageCreate, PageUpdate
from ..services.block_validator import validate_page_schema
from .deps import get_current_user

router = APIRouter(prefix="/pages", tags=["pages"])

@router.get("/", response_model=List[PageSchema])
async def get_pages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Page))
    return result.scalars().all()

@router.post("/", response_model=PageSchema)
async def create_page(
    page_in: PageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        validate_page_schema(page_in.schema.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    db_page = Page(
        slug=page_in.slug,
        title=page_in.title,
        status=page_in.status,
        schema=page_in.schema.model_dump(),
        created_by=current_user.id
    )
    db.add(db_page)
    await db.commit()
    await db.refresh(db_page)
    return db_page

@router.get("/{page_id}", response_model=PageSchema)
async def get_page(
    page_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_page = await db.get(Page, page_id)
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    return db_page

@router.put("/{page_id}", response_model=PageSchema)
async def update_page(
    page_id: UUID,
    page_in: PageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_page = await db.get(Page, page_id)
    if not db_page:
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
        # Unset other home pages
        await db.execute(
            Page.__table__.update().where(Page.id != page_id).values(is_home=False)
        )
        
    for field, value in update_data.items():
        setattr(db_page, field, value)
    
    db.add(db_page)
    await db.commit()
    await db.refresh(db_page)
    return db_page

@router.delete("/{page_id}")
async def delete_page(
    page_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_page = await db.get(Page, page_id)
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    await db.delete(db_page)
    await db.commit()
    return {"message": "Page deleted"}

@router.patch("/{page_id}/publish", response_model=PageSchema)
async def publish_page(
    page_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_page = await db.get(Page, page_id)
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    db_page.status = "published"
    db.add(db_page)
    await db.commit()
    await db.refresh(db_page)
    return db_page

@router.get("/public/{slug}", response_model=PageSchema)
async def get_public_page(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Page).where(Page.slug == slug, Page.status == "published"))
    db_page = result.scalar_one_or_none()
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found or not published")
    return db_page

@router.get("/public/site/home", response_model=PageSchema)
async def get_home_page(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Page).where(Page.is_home == True, Page.status == "published"))
    db_page = result.scalar_one_or_none()
    if not db_page:
        raise HTTPException(status_code=404, detail="Home page not found")
    return db_page
