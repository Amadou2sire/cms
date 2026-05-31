from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, Dict
from uuid import UUID
from datetime import datetime

class PageRevisionCreate(BaseModel):
    title: Optional[str] = None

class PageRevision(BaseModel):
    id: UUID
    page_id: UUID
    schema: Dict[str, Any]
    title: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})

class PageRevisionListItem(BaseModel):
    id: UUID
    page_id: UUID
    title: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})