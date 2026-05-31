from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .core.config import settings
from .core.database import engine, Base, ensure_runtime_schema_updates

# Import all models to ensure they are registered with Base.metadata
from .api import auth, pages, public, media, settings as api_settings, articles, projects, components, forms, webhooks  # noqa: F401

app = FastAPI(title="CANVAS CMS API", version="1.1.0", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Remove trailing slash redirect middleware for CORS issues
from starlette.middleware import Middleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

app.include_router(auth.router)
app.include_router(projects.router)  # Includes all project routes including /templates-public
app.include_router(pages.router)
app.include_router(public.router)
app.include_router(media.router)
app.include_router(api_settings.router)
app.include_router(articles.router)
app.include_router(components.router)
app.include_router(forms.router)
app.include_router(webhooks.router)

import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.on_event("startup")
async def on_startup():
    """Auto-create any new tables (e.g. articles) on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await ensure_runtime_schema_updates()

@app.get("/")
async def root():
    return {"message": "Welcome to CANVAS CMS API", "version": "1.1.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
