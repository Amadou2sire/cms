import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Boolean, JSON, Uuid
from sqlalchemy.sql import func
from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="editor")  # 'admin' | 'editor'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Page(Base):
    __tablename__ = "pages"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="draft")  # 'draft' | 'published'
    is_home = Column(Boolean, default=False, nullable=False)
    
    # schema contains meta, seo, geo, and root
    schema = Column(JSON, nullable=False, server_default='{}')
    
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Media(Base):
    __tablename__ = "media"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    mime_type = Column(String(100))
    size = Column(Integer)
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SiteSettings(Base):
    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, index=True)
    header_config = Column(JSON, nullable=False, server_default='{}')
    footer_config = Column(JSON, nullable=False, server_default='{}')
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
