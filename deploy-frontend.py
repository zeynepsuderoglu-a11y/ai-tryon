#!/usr/bin/env python3
"""
Frontend deploy scripti.
Kullanim: python deploy-frontend.py
Yapar: frontend src/ klasorunu sunucuya kopyalar, rebuild eder, restart eder.
"""

import paramiko
import os
import sys
import time

SERVER_IP = "81.17.103.222"
SERVER_USER = "root"
SERVER_PASS = "Nursude/2002"
SERVER_PATH = "/root/ai-tryon/frontend"
LOCAL_FRONTEND = os.path.join(os.path.dirname(__file__), "frontend")


def connect():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=15)
    return client


def run(client, cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    return out + err


def upload_dir(sftp, local_dir, remote_dir):
    """Recursive directory upload."""
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        sftp.mkdir(remote_dir)

    for item in os.listdir(local_dir):
        if item in ("node_modules", ".next", ".git"):
            continue
        local_path = os.path.join(local_dir, item)
        remote_path = remote_dir + "/" + item
        if os.path.isdir(local_path):
            upload_dir(sftp, local_path, remote_path)
        else:
            sftp.put(local_path, remote_path)


def main():
    print("Sunucuya baglaniliyor...")
    client = connect()
    sftp = client.open_sftp()

    print("Dosyalar yukleniyor (src/, public/, next.config.ts, Dockerfile)...")

    # Upload src/
    upload_dir(sftp, os.path.join(LOCAL_FRONTEND, "src"), SERVER_PATH + "/src")
    print("  src/ -> OK")

    # Upload public/
    upload_dir(sftp, os.path.join(LOCAL_FRONTEND, "public"), SERVER_PATH + "/public")
    print("  public/ -> OK")

    # Upload config files
    for fname in ["next.config.ts", "Dockerfile", "package.json", "tsconfig.json",
                  "tailwind.config.ts", "postcss.config.mjs"]:
        local = os.path.join(LOCAL_FRONTEND, fname)
        if os.path.exists(local):
            sftp.put(local, SERVER_PATH + "/" + fname)
            print(f"  {fname} -> OK")

    sftp.close()

    print("\nFrontend rebuild ediliyor (1-2 dakika surebilir)...")
    result = run(client, "cd /root/ai-tryon && docker compose build --no-cache frontend 2>&1 | tail -5")
    print(result)

    print("Container yeniden baslatiliyor...")
    result = run(client, "cd /root/ai-tryon && docker compose up -d --force-recreate frontend 2>&1")
    print(result)

    print("Bekleniyor (8 saniye)...")
    time.sleep(8)

    print("Son durum:")
    print(run(client, "docker logs ai-tryon-frontend-1 --tail 5 2>&1"))
    status = run(client, 'curl -s --max-time 5 -o /dev/null -w "%{http_code}" http://localhost:3000/')
    print(f"HTTP status: {status}")

    client.close()

    if "200" in status:
        print("\nDeploy basarili! https://www.studyoima.com")
    else:
        print("\nHATA: Site yanit vermiyor. Loglari kontrol et.")
        sys.exit(1)


if __name__ == "__main__":
    main()
