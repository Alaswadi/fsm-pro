@echo off
echo ========================================
echo FSM Pro - Production Fix Script
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo WARNING: .env file not found. Copying from .env.coolify...
    copy .env.coolify .env
    echo OK: .env file created
) else (
    echo OK: .env file exists
)

echo.
echo Current Configuration:
echo   - Frontend URL: https://fsmpro.phishsimulator.com
echo   - API URL: /api (relative - via nginx proxy^)
echo   - Database: PostgreSQL (auto-initialized^)
echo.

echo Stopping existing containers...
docker-compose -f docker-compose.coolify.yml down

echo.
echo Removing old images to force rebuild...
docker rmi fsm-pro-copy-admin:latest 2>nul
docker rmi fsm-pro-copy-nginx:latest 2>nul
docker rmi fsm-pro-copy-api:latest 2>nul

echo.
echo Building and starting containers...
docker-compose -f docker-compose.coolify.yml up -d --build

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Service Status:
docker-compose -f docker-compose.coolify.yml ps

echo.
echo Access your application:
echo   - Frontend: https://fsmpro.phishsimulator.com
echo   - API Health: https://fsmpro.phishsimulator.com/api/health
echo.
echo Default Login:
echo   - Email: admin@fsm.com
echo   - Password: admin123
echo.
echo View Logs:
echo   - All logs: docker-compose -f docker-compose.coolify.yml logs -f
echo   - API logs: docker-compose -f docker-compose.coolify.yml logs -f api
echo   - Frontend logs: docker-compose -f docker-compose.coolify.yml logs -f admin
echo   - Nginx logs: docker-compose -f docker-compose.coolify.yml logs -f nginx
echo.
echo Done! Your application should now be working.
pause

