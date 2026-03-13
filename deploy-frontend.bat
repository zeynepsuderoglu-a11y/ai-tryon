@echo off
echo Frontend deploy basliyor...
wsl bash -c "cd '/mnt/c/Users/Necat Ünlü/ai-tryon' && backend/venv/bin/python3 deploy-frontend.py"
pause
