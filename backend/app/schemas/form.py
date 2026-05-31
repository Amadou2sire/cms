from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime

class FormField(BaseModel):
    name: str
    type: str = "text"  # text, email, tel, number, select, textarea, checkbox
    label: str
    required: bool = False
    placeholder: Optional[str] = None
    options: Optional[List[str]] = None  # For select fields

class FormBase(BaseModel):
    name: str
    description: Optional[str] = None
    fields: List[FormField] = Field(default_factory=list)
    notification_email: Optional[str] = None
    webhook_url: Optional[str] = None

class FormCreate(FormBase):
    pass

class FormUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[List[FormField]] = None
    notification_email: Optional[str] = None
    webhook_url: Optional[str] = None

class Form(FormBase):
    id: UUID
    project_id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})

class FormSubmissionCreate(BaseModel):
    data: Dict[str, Any] = Field(default_factory=dict)

class FormSubmission(BaseModel):
    id: UUID
    form_id: UUID
    data: Dict[str, Any]
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})