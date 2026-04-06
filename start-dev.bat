@echo off
title ServiceHub Dev Server
cd /d "%~dp0frontend"
echo Installing dependencies...
call npm install --legacy-peer-deps 2>&1
echo.
echo Starting development server...
echo Open http://localhost:3000 in your browser
call npm run dev
pause
