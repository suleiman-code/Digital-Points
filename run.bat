@echo off
title Digital Points - Global Run
echo Starting Digital Points Services...
echo.

echo Checking frontend port 3000...
powershell -NoProfile -Command "try { $p = (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction Stop | Select-Object -First 1 -ExpandProperty OwningProcess); if ($p) { Stop-Process -Id $p -Force; Write-Host ('Stopped process on port 3000 (PID: ' + $p + ')') } } catch { }"
echo.

echo [1/2] Starting Backend (FastAPI)...
start "DigitalPoints-Backend" cmd /c "cd backend && python -m uvicorn main:app --reload"

echo [2/2] Starting Frontend (Next.js)...
start "DigitalPoints-Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo Servers are starting in separate windows.
echo API: http://localhost:8000/docs
echo Web: http://localhost:3000
echo.
pause
