import asyncio
import httpx
from app.core.config import settings


class FashnService:
    @property
    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {settings.FASHN_API_KEY}",
            "Content-Type": "application/json",
        }

    @property
    def _base_url(self) -> str:
        return settings.FASHN_API_URL

    async def run_tryon(
        self,
        model_image_url: str,
        garment_image_url: str,
        category: str = "tops",
        mode: str = "balanced",
        num_samples: int = 1,
        garment_photo_type: str = "auto",
        segmentation_free: bool = True,
    ) -> dict:
        payload = {
            "model_image": model_image_url,
            "garment_image": garment_image_url,
            "category": category,
            "mode": mode,
            "num_samples": num_samples,
            "garment_photo_type": garment_photo_type,
            "segmentation_free": segmentation_free,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self._base_url}/run",
                json=payload,
                headers=self._headers,
            )
            if not response.is_success:
                try:
                    err = response.json()
                    code = err.get("error", "")
                    msg = err.get("message", response.text)
                except Exception:
                    code, msg = "", response.text
                if code == "OutOfCredits":
                    raise RuntimeError("FASHN API kredisi tükendi. Lütfen fashn.ai hesabına kredi yükle.")
                raise RuntimeError(f"FASHN tryon error {response.status_code}: {msg}")
            return response.json()

    async def run_product_to_model(
        self,
        product_image_url: str,
        model_image_url: str | None = None,
        prompt: str = "",
        resolution: str = "1k",
        aspect_ratio: str = "3:4",
        num_images: int = 1,
        seed: int | None = None,
    ) -> dict:
        inputs: dict = {
            "product_image": product_image_url,
            "resolution": resolution,
            "aspect_ratio": aspect_ratio,
            "num_images": num_images,
            "num_samples": num_images,  # try-on modda FASHN bu parametreyi kullanıyor
        }
        if model_image_url:
            inputs["model_image"] = model_image_url  # try-on mode: 1 kredi (face_reference 4 krediydi)
        if prompt:
            inputs["prompt"] = prompt
        if seed is not None:
            inputs["seed"] = seed

        payload = {
            "model_name": "product-to-model",
            "inputs": inputs,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self._base_url}/run",
                json=payload,
                headers=self._headers,
            )
            if not response.is_success:
                try:
                    err = response.json()
                    code = err.get("error", "")
                    msg = err.get("message", response.text)
                except Exception:
                    code, msg = "", response.text
                if code == "OutOfCredits":
                    raise RuntimeError("FASHN API kredisi tükendi. Lütfen fashn.ai hesabına kredi yükle.")
                raise RuntimeError(f"FASHN product-to-model error {response.status_code}: {msg}")
            return response.json()

    async def get_status(self, prediction_id: str) -> dict:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self._base_url}/status/{prediction_id}",
                headers=self._headers,
            )
            response.raise_for_status()
            return response.json()

    async def poll_until_complete(
        self,
        prediction_id: str,
        poll_interval: float = 2.0,
        max_wait: float = 600.0,
    ) -> dict:
        elapsed = 0.0
        while elapsed < max_wait:
            result = await self.get_status(prediction_id)
            status = result.get("status", "")
            if status == "completed":
                return result
            if status in ("failed", "error", "canceled"):
                raise RuntimeError(f"FASHN prediction failed: {result.get('error', 'Unknown error')}")
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval
        raise TimeoutError(f"FASHN prediction {prediction_id} timed out after {max_wait}s")


fashn_service = FashnService()
