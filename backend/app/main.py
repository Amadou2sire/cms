from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .core.config import settings
from .api import auth, pages, public, media, settings as api_settings, articles
from .core.database import engine, Base

app = FastAPI(title="CANVAS CMS API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(pages.router)
app.include_router(public.router)
app.include_router(media.router)
app.include_router(api_settings.router)
app.include_router(articles.router)

import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.on_event("startup")
async def on_startup():
    """Auto-create any new tables (e.g. articles) on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "Welcome to CANVAS CMS API", "version": "1.1.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
