from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

def uuid_to_str(v):
    if isinstance(v, UUID):
        return str(v)
    return v

class SeoSchema(BaseModel):
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    metaKeywords: List[str] = []
    canonical: Optional[str] = None
    noIndex: bool = False
    noFollow: bool = False
    ogTitle: Optional[str] = None
    ogDescription: Optional[str] = None
    ogImage: Optional[str] = None
    ogType: str = "website"
    twitterCard: str = "summary_large_image"
    twitterSite: Optional[str] = None
    structuredData: Dict[str, Any] = {}

class GeoSchema(BaseModel):
    enabled: bool = True
    aiSummary: Optional[str] = None
    aiContext: Optional[str] = None
    aiKeyFacts: List[str] = []
    aiTone: str = "factuel"
    aiAudience: List[str] = []
    llmsTxt: Dict[str, Any] = {"enabled": True, "content": ""}
    citationSignals: Dict[str, Any] = {}
    entityDefinition: Dict[str, Any] = {}
    contentClarity: Dict[str, Any] = {"faqEnabled": False, "faqItems": []}

class BlockNode(BaseModel):
    id: str
    type: str
    props: Dict[str, Any] = {}
    children: List['BlockNode'] = []

class PageSchemaCore(BaseModel):
    meta: Dict[str, str] = {"title": "", "lang": "fr", "description": ""}
    seo: SeoSchema = Field(default_factory=SeoSchema)
    geo: GeoSchema = Field(default_factory=GeoSchema)
    root: Optional[BlockNode] = None

class PageBase(BaseModel):
    slug: str
    title: str
    status: str = "draft"
    is_home: bool = False
    scheduled_publish_at: Optional[datetime] = None
    schema: PageSchemaCore = Field(default_factory=PageSchemaCore)

class PageCreate(PageBase):
    pass

class PageUpdate(BaseModel):
    slug: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    is_home: Optional[bool] = None
    scheduled_publish_at: Optional[datetime] = None
    schema: Optional[PageSchemaCore] = None

class Page(PageBase):
    id: UUID
    project_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# PreviewLink schemas
class PreviewLinkBase(BaseModel):
    resource_type: str
    resource_id: str
    expires_at: Optional[datetime] = None

class PreviewLinkCreate(PreviewLinkBase):
    pass

class PreviewLink(PreviewLinkBase):
    id: str
    project_id: str
    token: str
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Resolve forward reference
BlockNode.model_rebuild()
