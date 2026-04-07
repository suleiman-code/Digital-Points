@echo off
title ServiceHub Dev Server
cd /d "%~dp0frontend"
echo Checking port 3000...
powershell -NoProfile -Command "try { $p = (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction Stop | Select-Object -First 1 -ExpandProperty OwningProcess); if ($p) { Stop-Process -Id $p -Force; Write-Host ('Stopped process on port 3000 (PID: ' + $p + ')') } } catch { }"
echo Installing dependencies...
call npm install --legacy-peer-deps 2>&1
echo.
echo Starting development server...
echo Open http://localhost:3000 in your browser
call npm run dev
pause
