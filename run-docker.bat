@echo off
TITLE TABLESERVE - Docker Compose Launcher
color 0B

echo ====================================================================
echo        TABLESERVE DOCKER COMPOSE MULTI-CONTAINER LAUNCHER
echo ====================================================================
echo.

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running.
    echo Please start Docker Desktop and try again.
    echo.
    echo Tip: You can run natively without Docker using 'run-local.bat'!
    pause
    exit /b 1
)

echo Building and starting all containers in background...
docker compose up --build -d

echo.
echo ====================================================================
echo Containers launched successfully!
echo   Frontend Web UI:       http://localhost:3000
echo   API Gateway:           http://localhost:5000
echo   Swagger Documentation: http://localhost:5000/api-docs
echo   PostgreSQL Database:   localhost:5432
echo ====================================================================
echo.
echo Showing logs (Press CTRL+C to detach):
docker compose logs -f
