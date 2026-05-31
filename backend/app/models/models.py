import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Boolean, JSON, Uuid, UniqueConstraint
from sqlalchemy.sql import func
from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="editor")  # 'admin' | 'editor'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Project(Base):
    __tablename__ = "projects"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    domain = Column(String(255), nullable=True)
    logo_url = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, default="active")  # 'active' | 'archived'
    languages = Column(JSON, nullable=False, server_default='["fr"]')
    default_language = Column(String(10), nullable=False, server_default='fr')
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False, default="editor")  # 'owner' | 'admin' | 'editor'
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

class Page(Base):
    __tablename__ = "pages"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    slug = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="draft")  # 'draft' | 'published' | 'scheduled'
    is_home = Column(Boolean, default=False, nullable=False)

    # schema contains meta, seo, geo, and root
    schema = Column(JSON, nullable=False, server_default='{}')

    # Scheduled publish fields
    scheduled_publish_at = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)

    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('project_id', 'slug', name='uix_page_project_slug'),
    )

class Media(Base):
    __tablename__ = "media"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    mime_type = Column(String(100))
    size = Column(Integer)
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SiteSettings(Base):
    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    header_config = Column(JSON, nullable=False, server_default='{}')
    footer_config = Column(JSON, nullable=False, server_default='{}')
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Article(Base):
    __tablename__ = "articles"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    image_url = Column(String(500), nullable=True)
    content = Column(Text, nullable=False, default="")
    slug = Column(String(255), nullable=False, index=True)
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, server_default='News')
    status = Column(String(50), nullable=False, default="draft")  # 'draft' | 'published'
    translations = Column(JSON, nullable=True)
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('project_id', 'slug', name='uix_article_project_slug'),
    )

# New: Global Component model
class Component(Base):
    __tablename__ = "components"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)  # e.g., "hero", "about", etc.
    default_props = Column(JSON, nullable=False, server_default='{}')
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('project_id', 'name', name='uix_component_project_name'),
    )

# New: Form model
class Form(Base):
    __tablename__ = "forms"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    fields = Column(JSON, nullable=False, server_default='[]')  # Field definitions: [{name, type, label, required, options}]
    notification_email = Column(String(255), nullable=True)
    webhook_url = Column(String(500), nullable=True)
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('project_id', 'name', name='uix_form_project_name'),
    )

# New: FormSubmission model
class FormSubmission(Base):
    __tablename__ = "form_submissions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    form_id = Column(Uuid(as_uuid=True), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True)
    data = Column(JSON, nullable=False, server_default='{}')  # Submitted data: {field_name: value}
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# New: PageRevision model for versioning
class PageRevision(Base):
    __tablename__ = "page_revisions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id = Column(Uuid(as_uuid=True), ForeignKey("pages.id", ondelete="CASCADE"), nullable=False, index=True)
    schema = Column(JSON, nullable=False)  # Full page schema snapshot
    title = Column(String(255), nullable=True)  # Snapshot of page title at that time
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# New: ComponentRevision model for component versioning
class ComponentRevision(Base):
    __tablename__ = "component_revisions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    component_id = Column(Uuid(as_uuid=True), ForeignKey("components.id", ondelete="CASCADE"), nullable=False, index=True)
    default_props = Column(JSON, nullable=False)  # Snapshot of component props
    name = Column(String(255), nullable=True)  # Snapshot of component name
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# New: PreviewLink model for draft preview
class PreviewLink(Base):
    __tablename__ = "preview_links"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False)  # 'page' | 'article'
    resource_id = Column(Uuid(as_uuid=True), nullable=False, index=True)
    token = Column(String(64), unique=True, nullable=False, index=True)  # UUID token for access
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Null = never expires
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# New: ProjectInvitation model for team invites
class ProjectInvitation(Base):
    __tablename__ = "project_invitations"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="editor")  # 'owner' | 'admin' | 'editor'
    token = Column(String(64), unique=True, nullable=False, index=True)
    status = Column(String(50), nullable=False, default="pending")  # 'pending' | 'accepted' | 'expired' | 'cancelled'
    invited_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)


# New: Webhook model for integrations
class Webhook(Base):
    __tablename__ = "webhooks"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    events = Column(JSON, nullable=False, server_default='[]')  # List of events: ['page.published', 'form.submitted', etc.]
    secret = Column(String(64), nullable=True)  # Webhook signing secret
    active = Column(Boolean, nullable=False, default=True)
    created_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# New: WebhookDelivery model to track delivery attempts
class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    webhook_id = Column(Uuid(as_uuid=True), ForeignKey("webhooks.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=False)
    status_code = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    success = Column(Boolean, nullable=True)
    attempt = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


