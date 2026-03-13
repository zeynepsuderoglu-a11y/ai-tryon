#!/bin/bash
# WSL2 kurulum scripti — sudo gerektirir
# Kullanım: sudo bash setup-wsl.sh

echo "📦 PostgreSQL ve Redis kuruluyor..."

apt-get update -qq
apt-get install -y postgresql postgresql-contrib redis-server python3.12-venv python3-pip

# PostgreSQL başlat
service postgresql start
sleep 2

# Veritabanı kullanıcısı ve DB oluştur
sudo -u postgres psql <<EOF
CREATE USER tryon WITH PASSWORD 'tryon123';
CREATE DATABASE tryon_db OWNER tryon;
GRANT ALL PRIVILEGES ON DATABASE tryon_db TO tryon;
EOF

# Redis başlat
service redis-server start

echo ""
echo "✅ Kurulum tamamlandı!"
echo "Şimdi normal terminalde çalıştır: bash start.sh"
