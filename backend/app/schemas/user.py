from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    role: str = "editor"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = None

class User(UserBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
