#!/usr/bin/env python3
"""
Tam deploy scripti — projeyi sunucuya gönderir ve başlatır.
Kullanım: python deploy.py
"""

import paramiko
import os
import sys

SERVER_IP = "81.17.103.222"
SERVER_USER = "root"
SERVER_PASS = "Studyoima/*2026"
SERVER_PATH = "/root/ai-tryon"
LOCAL_ROOT = os.path.dirname(os.path.abspath(__file__))

SKIP_DIRS = {"__pycache__", ".git", "venv", "node_modules", ".next", ".mypy_cache", ".pytest_cache"}
SKIP_EXTS = {".pyc", ".pyo"}


def connect():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    return client


def run(client, cmd, timeout=300, silent=False):
    if not silent:
        print(f"  $ {cmd[:80]}")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out and not silent:
        print(out[-600:] if len(out) > 600 else out)
    if err and not silent:
        print(err[-200:] if len(err) > 200 else err)
    return out + err


def ensure_dir(sftp, remote_dir):
    parts = remote_dir.split("/")
    path = ""
    for part in parts:
        if not part:
            path = "/"
            continue
        path = path.rstrip("/") + "/" + part
        try:
            sftp.stat(path)
        except FileNotFoundError:
            sftp.mkdir(path)


def upload_dir(sftp, local_dir, remote_dir):
    ensure_dir(sftp, remote_dir)
    for item in os.listdir(local_dir):
        if item in SKIP_DIRS or item.startswith("."):
            continue
        local_path = os.path.join(local_dir, item)
        remote_path = remote_dir + "/" + item
        if os.path.isdir(local_path):
            upload_dir(sftp, local_path, remote_path)
        else:
            _, ext = os.path.splitext(item)
            if ext not in SKIP_EXTS:
                sftp.put(local_path, remote_path)


def main():
    print("=" * 50)
    print("   AI TryOn — Full Deploy")
    print("=" * 50)

    client = connect()
    sftp = client.open_sftp()

    # 1. Dizin yapısını oluştur
    print("\n[1/5] Dizin yapısı oluşturuluyor...")
    for d in [SERVER_PATH, f"{SERVER_PATH}/backend", f"{SERVER_PATH}/frontend", f"{SERVER_PATH}/nginx"]:
        ensure_dir(sftp, d)

    # 2. Backend kodu yükle
    print("\n[2/5] Backend yükleniyor...")
    upload_dir(sftp, os.path.join(LOCAL_ROOT, "backend"), f"{SERVER_PATH}/backend")

    # 3. Frontend kodu yükle
    print("\n[3/5] Frontend yükleniyor...")
    upload_dir(sftp, os.path.join(LOCAL_ROOT, "frontend"), f"{SERVER_PATH}/frontend")

    # 4. Nginx ve docker-compose yükle
    print("\n[4/5] Nginx ve compose dosyaları yükleniyor...")
    sftp.put(
        os.path.join(LOCAL_ROOT, "nginx", "nginx.conf"),
        f"{SERVER_PATH}/nginx/nginx.conf"
    )
    sftp.put(
        os.path.join(LOCAL_ROOT, "docker-compose.prod.yml"),
        f"{SERVER_PATH}/docker-compose.prod.yml"
    )

    # .env dosyaları (gizli dosyalar ayrıca yükleniyor)
    sftp.put(
        os.path.join(LOCAL_ROOT, "backend", ".env"),
        f"{SERVER_PATH}/backend/.env"
    )

    sftp.close()

    # 5. Build ve başlat
    print("\n[5/5] Docker build ve başlatma (bu ~5dk sürebilir)...")
    run(client,
        f"cd {SERVER_PATH} && docker compose -f docker-compose.prod.yml up --build -d 2>&1",
        timeout=600)

    # Nginx DNS cache'ini temizle
    run(client,
        f"cd {SERVER_PATH} && docker compose -f docker-compose.prod.yml restart nginx 2>&1",
        timeout=30)

    print("\nContainer durumu:")
    run(client, "docker ps --format 'table {{.Names}}\\t{{.Status}}'")

    print("\nNginx erişim testi:")
    run(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost && echo")

    client.close()
    print("\n" + "=" * 50)
    print(f"   Deploy tamamlandı → http://{SERVER_IP}")
    print("=" * 50)


if __name__ == "__main__":
    main()
