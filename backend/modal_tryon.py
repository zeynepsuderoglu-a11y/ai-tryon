"""
CatVTON Self-Host Deployment — Modal.com
Çalışma mantığı:
  1. A10G GPU üzerinde CatVTON modeli yüklenir (cold start ~60s, sonra cached)
  2. POST /tryon → model_image_url + garment_image_url + cloth_type alır
  3. Try-on üretir, base64 olarak döndürür
  4. Backend bu sonucu Cloudinary'e yükler
"""

import io
import base64
import modal

# ── Sabitler ────────────────────────────────────────────────────────────────
CATVTON_REPO  = "https://github.com/Zheng-Chong/CatVTON"
CATVTON_HF    = "zheng-chong/CatVTON"
SD_BASE       = "runwayml/stable-diffusion-inpainting"

# ── Modal Image (Docker container) ───────────────────────────────────────────
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(["git", "libgl1-mesa-glx", "libglib2.0-0", "libglib2.0-dev"])
    .run_commands("git clone https://github.com/Zheng-Chong/CatVTON /app/CatVTON")
    .pip_install(
        ["torch==2.0.1", "torchvision==0.15.2"],
        extra_options="--extra-index-url https://download.pytorch.org/whl/cu118",
    )
    .run_commands("pip install -r /app/CatVTON/requirements.txt --quiet")
    # Versiyon çakışmasını çöz: peft>=0.12 clear_device_cache ister, diffusers>=0.28 peft.helpers ister
    # CatVTON ile uyumlu eski stabil versiyonlara pin at
    .pip_install([
        "diffusers==0.29.0",
        "peft==0.7.1",
        "accelerate==0.26.0",
        "transformers==4.38.0",
        "httpx",
        "Pillow",
    ])
)

# ── Modal App ────────────────────────────────────────────────────────────────
app = modal.App("ai-tryon-catvton", image=image)


@app.cls(
    gpu="A10G",
    timeout=300,
    scaledown_window=300,   # 5 dk boşta kalırsa kapat (maliyet tasarrufu)
)
@modal.concurrent(max_inputs=4)
class CatVTON:

    @modal.enter()
    def load(self):
        """Container başladığında modeli yükle (bir kez çalışır)."""
        import sys, torch
        sys.path.insert(0, "/app/CatVTON")

        from model.pipeline import CatVTONPipeline
        from model.cloth_masker import AutoMasker
        from diffusers.image_processor import VaeImageProcessor

        self.device = "cuda"
        self.dtype  = torch.float16

        self.pipeline = CatVTONPipeline(
            base_ckpt=SD_BASE,
            attn_ckpt=CATVTON_HF,
            attn_ckpt_version="mix",
            weight_dtype=self.dtype,
            use_tf32=False,
            device=self.device,
            skip_safety_check=True,
        )

        self.automasker = AutoMasker(
            densepose_ckpt=f"{CATVTON_HF}/DensePose",
            schp_ckpt=f"{CATVTON_HF}/SCHP",
            device=self.device,
        )

        self.mask_proc = VaeImageProcessor(
            vae_scale_factor=8,
            do_normalize=False,
            do_binarize=True,
            do_convert_grayscale=True,
        )

        print("✅ CatVTON modeli yüklendi.")

    # ── Yardımcı ─────────────────────────────────────────────────────────────
    @staticmethod
    def _fetch(url: str, size=(768, 1024)):
        import httpx
        from PIL import Image
        with httpx.Client(timeout=30) as c:
            r = c.get(url)
            r.raise_for_status()
        return Image.open(io.BytesIO(r.content)).convert("RGB").resize(size)

    # ── Ana endpoint ─────────────────────────────────────────────────────────
    @modal.fastapi_endpoint(method="POST")
    def tryon(self, data: dict):
        """
        Girdi:
            model_image_url  : str  — manken fotoğrafı (Cloudinary URL)
            garment_image_url: str  — kıyafet fotoğrafı (Cloudinary URL)
            cloth_type       : str  — "upper" | "lower" | "overall"
        Çıktı:
            { "status": "success", "image_b64": "<jpeg base64>" }
        """
        import torch

        cloth_type   = data.get("cloth_type", "upper")
        model_img    = self._fetch(data["model_image_url"])
        garment_img  = self._fetch(data["garment_image_url"])

        # Otomatik maske üret
        mask = self.automasker(model_img, cloth_type)["mask"]
        mask = self.mask_proc.blur(mask, blur_factor=9)

        # Try-on üret
        result = self.pipeline(
            image=model_img,
            condition_image=garment_img,
            mask=mask,
            num_inference_steps=50,
            guidance_scale=2.5,
            height=1024,
            width=768,
            generator=torch.Generator(device=self.device).manual_seed(42),
        ).images[0]

        # JPEG → base64
        buf = io.BytesIO()
        result.save(buf, format="JPEG", quality=95)
        return {
            "status": "success",
            "image_b64": base64.b64encode(buf.getvalue()).decode(),
        }
