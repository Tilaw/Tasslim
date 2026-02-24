@echo off
echo ===================================================
echo TASSLIM PARTS MANAGER - LIVE SERVER STARTUP
echo ===================================================
echo.

echo Checking for PM2 Process Manager...
call npm list -g pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo PM2 is not installed. Installing PM2 globally...
    call npm install -g pm2
    echo PM2 installed successfully!
) else (
    echo PM2 is already installed.
)

echo.
echo Starting backend server with PM2...
cd backend
call npm run start:live
echo.
echo Server started successfully! It will automatically restart if it crashes, and it will restart every hour on the dot.
echo.
echo You can view the live status anytime by running:
echo cd backend ^& pm2 status
echo.
pause
