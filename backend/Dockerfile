FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc libgl1 libglib2.0-0 wget unzip libvulkan1 mesa-vulkan-drivers \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/local/realesrgan && \
    wget -q "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-ubuntu.zip" \
    -O /tmp/realesrgan.zip && \
    unzip -q /tmp/realesrgan.zip -d /usr/local/realesrgan && \
    chmod +x /usr/local/realesrgan/realesrgan-ncnn-vulkan && \
    rm /tmp/realesrgan.zip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
