import asyncio
from app.core.database import engine, Base
from sqlalchemy import inspect
from app.core.security import get_password_hash
from app.models.models import User
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal

async def init_db():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Check tables
    async with engine.begin() as conn:
        tables = await conn.run_sync(lambda x: inspect(x).get_table_names())
        print("Tables created:", tables)

    # Check if superadmin exists
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == "superadmin@gmail.com"))
        user = result.scalars().first()
        if user:
            print("User exists:", user.email, user.role)
        else:
            print("Creating superadmin...")
            hashed_password = get_password_hash("superadmin")
            new_user = User(
                email="superadmin@gmail.com",
                password_hash=hashed_password,
                role="admin"
            )
            session.add(new_user)
            await session.commit()
            print("Superadmin created successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())