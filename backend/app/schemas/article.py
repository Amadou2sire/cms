from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict
from uuid import UUID
from datetime import datetime


class ArticleBase(BaseModel):
    project_id: Optional[UUID] = None
    title: str
    slug: Optional[str] = None
    image_url: Optional[str] = None
    content: str = ""
    status: str = "draft"
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    category: Optional[str] = 'News'
    translations: Optional[Dict[str, Any]] = None


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
    translations: Optional[Dict[str, Any]] = None


class Article(ArticleBase):
    id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})
