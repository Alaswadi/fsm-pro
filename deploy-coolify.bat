@echo off
REM FSM Pro - Coolify Deployment Script (Windows)
REM This script helps deploy the application to Coolify VPS

echo ============================================================================
echo FSM Pro - Coolify Deployment
echo ============================================================================
echo.

REM Check if .env file exists
if not exist .env (
    echo WARNING: .env file not found. Creating from .env.coolify...
    copy .env.coolify .env
    echo .env file created
    echo.
    echo Please edit .env file and update the following:
    echo    - DB_PASSWORD
    echo    - JWT_SECRET
    echo    - CORS_ORIGIN
    echo    - FRONTEND_URL
    echo    - REACT_APP_API_URL
    echo.
    pause
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

echo Docker is running
echo.

REM Ask for deployment action
echo What would you like to do?
echo 1) Deploy (first time)
echo 2) Update (rebuild and restart)
echo 3) Stop services
echo 4) View logs
echo 5) Backup database
echo 6) Exit
echo.
set /p choice="Enter your choice [1-6]: "

if "%choice%"=="1" goto deploy
if "%choice%"=="2" goto update
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto backup
if "%choice%"=="6" goto exit
goto invalid

:deploy
echo.
echo Starting deployment...
echo.
docker-compose -f docker-compose.coolify.yml --env-file .env up -d --build
echo.
echo Deployment complete!
echo.
echo Services are running on:
echo   - Admin Dashboard: http://your-domain.com:7000
echo   - API: http://your-domain.com:7001/api
echo   - Nginx Proxy: http://your-domain.com:7080
echo.
echo Default login credentials:
echo   - Email: admin@fsm.com
echo   - Password: admin123
echo.
echo WARNING: Remember to change the default password!
goto end

:update
echo.
echo Updating application...
echo.
git pull origin main
docker-compose -f docker-compose.coolify.yml --env-file .env up -d --build
echo.
echo Update complete!
goto end

:stop
echo.
echo Stopping services...
echo.
docker-compose -f docker-compose.coolify.yml down
echo.
echo Services stopped
goto end

:logs
echo.
echo Viewing logs (Press Ctrl+C to exit)...
echo.
docker-compose -f docker-compose.coolify.yml logs -f
goto end

:backup
echo.
echo Creating database backup...
echo.
set BACKUP_FILE=backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%
docker exec fsm-postgres-coolify pg_dump -U fsm_user fsm_db > %BACKUP_FILE%
echo.
echo Backup created: %BACKUP_FILE%
goto end

:invalid
echo.
echo ERROR: Invalid choice
pause
exit /b 1

:exit
echo.
echo Goodbye!
exit /b 0

:end
echo.
echo ============================================================================
pause

