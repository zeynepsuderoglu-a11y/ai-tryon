from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://tryon:tryon123@localhost:5432/tryon_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # FASHN.ai (primary try-on)
    FASHN_API_KEY: str = ""
    FASHN_API_URL: str = "https://api.fashn.ai/v1"

    # Replicate (fallback / garment preprocessing)
    REPLICATE_API_TOKEN: str = ""
    REPLICATE_TRYON_MODEL: str = "cuuupid/idm-vton"

    # FAL.ai (alternative try-on provider)
    FAL_KEY: str = ""

    # Anthropic (garment analysis)
    ANTHROPIC_API_KEY: str = ""

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@imatryon.com"
    EMAIL_FROM_NAME: str = "İMA Tryon"

    # Credits
    CREDITS_PER_GENERATION: int = 1
    INITIAL_CREDITS: int = 3

    # App
    APP_NAME: str = "AI TryOn Platform"
    DEBUG: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
