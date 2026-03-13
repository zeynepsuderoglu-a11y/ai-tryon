#!/usr/bin/env python3
"""
Backend deploy scripti.
Yapar: backend/app/ klasorunu sunucuya kopyalar, docker rebuild eder.
"""

import paramiko
import os
import sys

SERVER_IP = "81.17.103.222"
SERVER_USER = "root"
SERVER_PASS = "Nursude/2002"
SERVER_PATH = "/root/ai-tryon/backend"
LOCAL_BACKEND = os.path.join(os.path.dirname(__file__), "backend")


def connect():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=15)
    return client


def run(client, cmd, timeout=300):
    print(f"$ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out:
        print(out)
    if err:
        print(err)
    return out + err


def upload_dir(sftp, local_dir, remote_dir):
    """Recursive directory upload."""
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        sftp.mkdir(remote_dir)

    for item in os.listdir(local_dir):
        if item in ("__pycache__", ".git", "venv", ".env", "*.pyc"):
            continue
        local_path = os.path.join(local_dir, item)
        remote_path = remote_dir + "/" + item
        if os.path.isdir(local_path):
            upload_dir(sftp, local_path, remote_path)
        else:
            if not item.endswith(".pyc"):
                sftp.put(local_path, remote_path)
                print(f"  -> {remote_path}")


def main():
    print("=== Backend Deploy ===")
    client = connect()
    sftp = client.open_sftp()

    # Upload app/ directory
    local_app = os.path.join(LOCAL_BACKEND, "app")
    remote_app = SERVER_PATH + "/app"
    print(f"\nUploading {local_app} → {remote_app}")
    upload_dir(sftp, local_app, remote_app)
    sftp.close()

    print("\nRebuilding backend Docker image...")
    out = run(client, "cd /root/ai-tryon && docker compose up --build -d backend 2>&1", timeout=300)
    print(out)

    print("\nChecking container status...")
    run(client, "docker ps | grep backend", timeout=10)

    print("\nRecent backend logs:")
    run(client, "docker logs ai-tryon-backend-1 --tail 20 2>&1", timeout=10)

    client.close()
    print("\n=== Deploy complete ===")


if __name__ == "__main__":
    main()
