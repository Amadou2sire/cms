import asyncio
from app.core.database import AsyncSessionLocal
from app.models.models import Page
from sqlalchemy.future import select
import json

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Page))
        pages = result.scalars().all()
        for p in pages:
            print(f"Page ID: {p.id}")
            print(f"Title: {p.title}")
            print(f"Slug: {p.slug}")
            print(f"Status: {p.status}")
            print(f"Schema Children Types: {[b.get('type') for b in p.schema.get('root', {}).get('children', [])] if p.schema else 'None'}")
            print(f"Header Block Props: {[b.get('props') for b in p.schema.get('root', {}).get('children', []) if b.get('type') == 'header'] if p.schema else 'None'}")
            print("-" * 50)

if __name__ == "__main__":
    asyncio.run(check())
