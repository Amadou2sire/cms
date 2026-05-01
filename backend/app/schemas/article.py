from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class ArticleBase(BaseModel):
    title: str
    slug: Optional[str] = None
    image_url: Optional[str] = None
    content: str = ""
    status: str = "draft"
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    category: Optional[str] = 'News'


class ArticleCreate(ArticleBase):
    pass


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    image_url: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    category: Optional[str] = None


class Article(ArticleBase):
    id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
