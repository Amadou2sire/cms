from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    languages: List[str] = ["fr"]
    default_language: str = "fr"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    status: Optional[str] = None
    languages: Optional[List[str]] = None
    default_language: Optional[str] = None

class Project(ProjectBase):
    id: UUID
    status: str
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})

class ProjectMemberRead(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    role: str
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})

class ProjectWithMembers(Project):
    members: list[ProjectMemberRead] = []

# Invitation schemas
class ProjectInvitationCreate(BaseModel):
    email: str
    role: str = "editor"  # 'owner' | 'admin' | 'editor'
    expires_in_hours: Optional[int] = 72  # Default 3 days

class ProjectInvitation(BaseModel):
    id: UUID
    project_id: UUID
    email: str
    role: str
    token: str
    status: str  # 'pending' | 'accepted' | 'expired' | 'cancelled'
    invited_by: Optional[UUID] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})

# Member update
class MemberUpdate(BaseModel):
    role: str  # 'owner' | 'admin' | 'editor'
