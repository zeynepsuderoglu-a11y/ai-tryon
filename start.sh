#!/bin/bash

# AI TryOn Platform — Tek komutla başlatma scripti
# Kullanım: bash start.sh

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

export PATH="$HOME/.local/bin:$PATH"

echo ""
echo "🚀 AI TryOn Platform başlatılıyor..."
echo ""

# ─── 1. PostgreSQL ────────────────────────────────────────────────────────────
if ! pg_isready -q 2>/dev/null; then
    echo "📦 PostgreSQL başlatılıyor..."
    sudo service postgresql start 2>/dev/null || true
    sleep 2
fi

# Veritabanı ve kullanıcı oluştur (zaten varsa hata vermez)
sudo -u postgres psql -c "CREATE USER tryon WITH PASSWORD 'tryon123';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE tryon_db OWNER tryon;" 2>/dev/null || true
echo "✅ PostgreSQL hazır"

# ─── 2. Redis ─────────────────────────────────────────────────────────────────
if ! redis-cli ping &>/dev/null 2>&1; then
    echo "📦 Redis başlatılıyor..."
    sudo service redis-server start 2>/dev/null || true
    sleep 1
fi
echo "✅ Redis hazır"

# ─── 3. Backend ───────────────────────────────────────────────────────────────
if [ ! -f "$BACKEND_DIR/venv/bin/python" ]; then
    echo "📦 Backend venv kuruluyor..."
    uv venv "$BACKEND_DIR/venv" --python 3.12
    uv pip install -r "$BACKEND_DIR/requirements.txt" --python "$BACKEND_DIR/venv/bin/python"
fi

echo "🔧 Backend başlatılıyor (port 8000)..."
cd "$BACKEND_DIR"
"$BACKEND_DIR/venv/bin/python" -m scripts.seed 2>/dev/null || true
"$BACKEND_DIR/venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "✅ Backend PID: $BACKEND_PID"

# ─── 4. Celery Worker ─────────────────────────────────────────────────────────
"$BACKEND_DIR/venv/bin/celery" -A app.tasks.batch_tasks.celery_app worker \
    --loglevel=warning --concurrency=2 &
CELERY_PID=$!
echo "✅ Celery Worker PID: $CELERY_PID"

# ─── 5. Frontend ──────────────────────────────────────────────────────────────
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "📦 Frontend bağımlılıkları kuruluyor..."
    cd "$FRONTEND_DIR" && npm install
fi

echo "🎨 Frontend başlatılıyor (port 3000)..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend PID: $FRONTEND_PID"

# ─── Özet ─────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🌐 Frontend:  http://localhost:3000"
echo "  ⚡ Backend:   http://localhost:8000"
echo "  📚 API Docs:  http://localhost:8000/docs"
echo "  👤 Admin:     admin@tryon.ai / admin123456"
echo "  👤 Demo:      demo@tryon.ai / demo123456"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Durdurmak için: Ctrl+C"
echo ""

# Ctrl+C ile tüm process'leri durdur
trap "echo 'Durduruluyor...'; kill $BACKEND_PID $CELERY_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
