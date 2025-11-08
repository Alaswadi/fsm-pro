@echo off
REM Reset Database Script
REM This will DELETE ALL DATA and reinitialize the database from init.sql

echo ==========================================
echo WARNING: DATABASE RESET SCRIPT
echo ==========================================
echo.
echo This will:
echo   1. Stop all services
echo   2. DELETE the database volume (ALL DATA LOST!)
echo   3. Restart services
echo   4. Auto-initialize database from init.sql
echo.
set /p confirm="Are you sure you want to continue? (yes/no): "

if not "%confirm%"=="yes" (
    echo Aborted.
    exit /b 1
)

echo.
echo Step 1: Stopping services...
docker-compose -f docker-compose.coolify.yml down

echo.
echo Step 2: Removing database volume...
docker volume rm fsm-pro-copy_postgres_data

echo.
echo Step 3: Starting services...
docker-compose -f docker-compose.coolify.yml up -d

echo.
echo Step 4: Waiting for database initialization (15 seconds)...
timeout /t 15 /nobreak

echo.
echo Step 5: Checking database logs...
docker logs fsm-postgres-coolify --tail 30

echo.
echo Step 6: Verifying tables...
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "\dt"

echo.
echo Step 7: Verifying users...
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT email, full_name, role FROM users;"

echo.
echo ==========================================
echo Database Reset Complete!
echo ==========================================
echo.
echo Default Login Credentials:
echo.
echo Admin:
echo   Email: admin@fsm.com
echo   Password: admin123
echo.
echo Mobile Tech:
echo   Email: mobile.tech@fsm.com
echo   Password: mobile123
echo.
echo ==========================================
echo.
pause

