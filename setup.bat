@echo off
REM Quick-start setup script for Windows
REM Airfare Price Index (APIx)

echo.
echo ================================
echo Airfare Price Index (APIx) Setup
echo ================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker not found. Please install Docker from https://docker.com
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker Compose not found. Please install Docker Compose
    pause
    exit /b 1
)

echo Docker and Docker Compose found
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo .env file created. Review and edit if needed.
) else (
    echo .env file already exists
)

echo.
echo Starting services with docker-compose up -d...
docker-compose up -d

echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak

echo.
echo ================================
echo Services Status
echo ================================
echo.

echo API Server:    http://localhost:5000
echo API Docs:      http://localhost:5000/docs
echo Dashboard:     http://localhost:8501
echo.

echo ================================
echo Next Steps
echo ================================
echo.
echo 1. Open your browser and visit:
echo    - Dashboard: http://localhost:8501
echo    - API Docs: http://localhost:5000/docs
echo.
echo 2. Trigger a scrape:
echo    curl -X POST http://localhost:5000/scrape/indigo?origin=DEL^&destination=BOM
echo.
echo 3. View collected fares:
echo    curl http://localhost:5000/fares
echo.
echo 4. Stop services when done:
echo    docker-compose down
echo.

echo Setup complete!
pause
