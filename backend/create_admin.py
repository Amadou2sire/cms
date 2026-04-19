import asyncio
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.models import User
from app.core.security import get_password_hash
from sqlalchemy.future import select

async def create_superadmin():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if user already exists
        result = await session.execute(select(User).where(User.email == "superadmin@gmail.com"))
        user = result.scalars().first()
        
        if user:
            print("User superadmin@gmail.com already exists.")
            return

        # Create new user
        hashed_password = get_password_hash("superadmin")
        new_user = User(
            email="superadmin@gmail.com",
            password_hash=hashed_password,
            role="admin"
        )
        session.add(new_user)
        await session.commit()
        print("Superadmin user created successfully!")

if __name__ == "__main__":
    asyncio.run(create_superadmin())
