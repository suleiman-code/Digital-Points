@echo off
title Digital Points - Global Run
echo Starting Digital Points Services...
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
