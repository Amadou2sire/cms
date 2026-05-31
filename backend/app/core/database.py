from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from .config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def ensure_runtime_schema_updates():
    """
    Lightweight runtime schema guard for environments without Alembic.
    Collections feature is deprecated: drop legacy tables if present.
    """
    async with engine.begin() as conn:
        dialect = conn.dialect.name
        if dialect == "postgresql":
            await conn.execute(text("DROP TABLE IF EXISTS collection_items"))
            await conn.execute(text("DROP TABLE IF EXISTS collections"))
            return

        if dialect == "sqlite":
            await conn.execute(text("DROP TABLE IF EXISTS collection_items"))
            await conn.execute(text("DROP TABLE IF EXISTS collections"))
