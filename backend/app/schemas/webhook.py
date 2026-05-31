from pydantic import BaseModel, HttpUrl, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class WebhookBase(BaseModel):
    name: str
    url: str
    events: List[str] = []
    active: bool = True

class WebhookCreate(WebhookBase):
    pass

class WebhookUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    events: Optional[List[str]] = None
    active: Optional[bool] = None

class Webhook(WebhookBase):
    id: str
    project_id: str
    secret: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})

class WebhookDeliveryRead(BaseModel):
    id: str
    webhook_id: str
    event_type: str
    status_code: Optional[int] = None
    success: Optional[bool] = None
    attempt: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})