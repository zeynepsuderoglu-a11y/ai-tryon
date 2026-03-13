@echo off
:: AI TryOn — Windows'tan cift tikla calistir
:: Docker Desktop acik olmali!

echo.
echo === AI TryOn Platform baslatiliyor ===
echo.

:: WSL'de start-dev.sh calistir
wsl -e bash -c "cd '/mnt/c/Users/Necat Ünlü/ai-tryon' && bash start-dev.sh"

echo.
echo Tarayicida ac: http://localhost:3000
pause
