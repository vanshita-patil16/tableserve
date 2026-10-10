@echo off
TITLE TABLESERVE - Local Microservices Platform
color 0A

echo ====================================================================
echo             TABLESERVE RESTAURANT PLATFORM LAUNCHER
echo ====================================================================
echo.

:: Ensure Node is on PATH if installed in standard location
set "PATH=C:\Program Files\nodejs;%PATH%"

echo [1/3] Checking Node.js environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on PATH. Please install Node.js v18+.
    pause
    exit /b 1
)

echo [2/3] Seeding initial database and state...
node database/seeder.js

echo.
echo [3/3] Launching all 4 microservices, API Gateway, and React Frontend...
echo.
echo --------------------------------------------------------------------
echo   Web Application UI:      http://localhost:3000
echo   API Gateway Endpoint:    http://localhost:5000
echo   Unified Swagger Docs:    http://localhost:5000/api-docs
echo   Health Status:           http://localhost:5000/health
echo --------------------------------------------------------------------
echo.
echo Press CTRL+C to stop all services.
echo.

node start-all.js
pause
