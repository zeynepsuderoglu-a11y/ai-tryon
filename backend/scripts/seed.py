"""
Seed script: create admin user + demo model assets.
Run: python -m scripts.seed
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import AsyncSessionLocal, create_tables
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.model_asset import ModelAsset, Gender, BodyType, SkinTone
from sqlalchemy import select


DEMO_MODELS = [
    {
        "name": "Sofia",
        "gender": Gender.female,
        "body_type": BodyType.average,
        "skin_tone": SkinTone.light,
        "image_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
        "thumbnail_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=70",
    },
    {
        "name": "Mia",
        "gender": Gender.female,
        "body_type": BodyType.slim,
        "skin_tone": SkinTone.medium,
        "image_url": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80",
        "thumbnail_url": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&q=70",
    },
    {
        "name": "Zara",
        "gender": Gender.female,
        "body_type": BodyType.plus_size,
        "skin_tone": SkinTone.dark,
        "image_url": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
        "thumbnail_url": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=70",
    },
    {
        "name": "Alex",
        "gender": Gender.male,
        "body_type": BodyType.average,
        "skin_tone": SkinTone.medium,
        "image_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
        "thumbnail_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=70",
    },
    {
        "name": "Jordan",
        "gender": Gender.unisex,
        "body_type": BodyType.slim,
        "skin_tone": SkinTone.light,
        "image_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
        "thumbnail_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=70",
    },
    {
        "name": "Marcus",
        "gender": Gender.male,
        "body_type": BodyType.average,
        "skin_tone": SkinTone.dark,
        "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
        "thumbnail_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=70",
    },
]


async def seed():
    await create_tables()
    async with AsyncSessionLocal() as db:
        # Create admin user
        existing = (await db.execute(select(User).where(User.email == "admin@tryon.ai"))).scalar_one_or_none()
        if not existing:
            admin = User(
                email="admin@tryon.ai",
                password_hash=get_password_hash("admin123456"),
                full_name="Admin",
                role=UserRole.admin,
                clothing_credits=9999,
                eyewear_credits=9999,
            )
            db.add(admin)
            print("✓ Admin user created: admin@tryon.ai / admin123456")
        else:
            print("→ Admin user already exists")

        # Create demo user
        demo = (await db.execute(select(User).where(User.email == "demo@tryon.ai"))).scalar_one_or_none()
        if not demo:
            demo_user = User(
                email="demo@tryon.ai",
                password_hash=get_password_hash("demo123456"),
                full_name="Demo User",
                clothing_credits=10,
                eyewear_credits=10,
            )
            db.add(demo_user)
            print("✓ Demo user created: demo@tryon.ai / demo123456")

        # Seed models
        for model_data in DEMO_MODELS:
            existing_model = (
                await db.execute(select(ModelAsset).where(ModelAsset.name == model_data["name"]))
            ).scalar_one_or_none()
            if not existing_model:
                model = ModelAsset(**model_data)
                db.add(model)
                print(f"✓ Model '{model_data['name']}' created")

        await db.commit()
        print("\nSeed completed!")


if __name__ == "__main__":
    asyncio.run(seed())
