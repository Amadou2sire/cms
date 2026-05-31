from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime

class ComponentBase(BaseModel):
    name: str
    type: str
    default_props: Dict[str, Any] = Field(default_factory=dict)

class ComponentCreate(ComponentBase):
    pass

class ComponentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    default_props: Optional[Dict[str, Any]] = None

class Component(ComponentBase):
    id: UUID
    project_id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})

# ComponentRevision schemas
class ComponentRevisionBase(BaseModel):
    name: Optional[str] = None
    default_props: Dict[str, Any] = Field(default_factory=dict)

class ComponentRevisionCreate(ComponentRevisionBase):
    pass

class ComponentRevisionListItem(BaseModel):
    id: str
    component_id: str
    name: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})

class ComponentRevision(ComponentRevisionBase):
    id: str
    component_id: str
    created_by: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})