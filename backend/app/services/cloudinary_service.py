import cloudinary
import cloudinary.uploader
import httpx
from app.core.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


class CloudinaryService:
    def upload_file(self, file_bytes: bytes, folder: str = "tryon/garments", **kwargs) -> dict:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=folder,
            resource_type="image",
            **kwargs,
        )
        return result

    def upload_from_url(self, url: str, folder: str = "tryon/outputs", **kwargs) -> dict:
        result = cloudinary.uploader.upload(
            url,
            folder=folder,
            resource_type="image",
            **kwargs,
        )
        return result

    def delete_image(self, public_id: str) -> dict:
        return cloudinary.uploader.destroy(public_id)

    async def upload_file_async(
        self, file_bytes: bytes, folder: str = "tryon/garments", **kwargs
    ) -> dict:
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, lambda: self.upload_file(file_bytes, folder, **kwargs)
        )

    async def upload_from_url_async(
        self, url: str, folder: str = "tryon/outputs", **kwargs
    ) -> dict:
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, lambda: self.upload_from_url(url, folder, **kwargs)
        )

    def get_thumbnail_url(self, original_url: str, width: int = 300, height: int = 400) -> str:
        # Transform cloudinary URL for thumbnail
        if "cloudinary.com" not in original_url:
            return original_url
        return cloudinary.utils.cloudinary_url(
            original_url,
            width=width,
            height=height,
            crop="fill",
            gravity="face",
        )[0]


cloudinary_service = CloudinaryService()
