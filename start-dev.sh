#!/bin/bash
# AI TryOn — Dev başlatma scripti
# WSL'den: bash start-dev.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo ""
echo "=== AI TryOn Platform ==="
echo ""

# ─── 1. Docker infra (PostgreSQL + Redis) ─────────────────────────────────────
echo "[1/3] PostgreSQL + Redis baslatiliyor..."
docker-compose -f "$ROOT_DIR/docker-compose.dev.yml" up -d 2>/dev/null
if [ $? -ne 0 ]; then
    echo "HATA: Docker calismıyor! Docker Desktop'i ac ve tekrar dene."
    exit 1
fi
echo "    PostgreSQL + Redis hazir"

# ─── 2. Backend ───────────────────────────────────────────────────────────────
echo "[2/3] Backend baslatiliyor (port 8000)..."
# Eski process varsa kapat
pkill -f "uvicorn app.main:app" 2>/dev/null || true
sleep 1
cd "$BACKEND_DIR"
nohup "$BACKEND_DIR/venv/bin/uvicorn" app.main:app \
    --host 0.0.0.0 --port 8000 --reload \
    > /tmp/backend.log 2>&1 &
echo "    Backend PID: $!"

# Backend hazır olana kadar bekle
for i in $(seq 1 15); do
    sleep 1
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "    Backend hazir"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "    Backend yavas basliyor, devam..."
    fi
done

# ─── 3. Frontend ──────────────────────────────────────────────────────────────
echo "[3/3] Frontend baslatiliyor (port 3000)..."
pkill -f "next dev" 2>/dev/null || true
sleep 1
cd "$FRONTEND_DIR"
nohup npm run dev > /tmp/frontend.log 2>&1 &
echo "    Frontend PID: $!"

# Ready mesajı bekle
echo "    Derleniyor..."
for i in $(seq 1 60); do
    sleep 1
    if grep -q "Ready in" /tmp/frontend.log 2>/dev/null; then
        echo "    Frontend hazir"
        break
    fi
done

# ─── Ozet ─────────────────────────────────────────────────────────────────────
echo ""
echo "=================================="
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo "=================================="
echo ""
echo "Loglar: tail -f /tmp/backend.log"
echo "        tail -f /tmp/frontend.log"
echo ""
