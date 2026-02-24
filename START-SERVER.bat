@echo off
title Tasslim Parts Manager - Local Server
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   Tasslim Parts Manager - Local Server   ║
echo  ║   Data is saved to inventory.db (SQLite) ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  Starting backend on http://localhost:4000 ...
echo  (Keep this window open while using the app)
echo.
cd /d "%~dp0backend"
npm run dev
pause
