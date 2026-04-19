from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

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
    schema: PageSchemaCore = Field(default_factory=PageSchemaCore)

class PageCreate(PageBase):
    pass

class PageUpdate(BaseModel):
    slug: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    is_home: Optional[bool] = None
    schema: Optional[PageSchemaCore] = None

class Page(PageBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Resolve forward reference
BlockNode.model_rebuild()
