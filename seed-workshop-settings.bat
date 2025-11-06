@echo off
echo ============================================================================
echo Seeding Workshop Settings for Companies
echo ============================================================================
echo.
echo This script will create default workshop settings for any companies
echo that don't have workshop settings configured yet.
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if postgres container is running
docker-compose ps postgres | findstr "Up" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PostgreSQL container is not running.
    echo Please start the containers with: docker-compose up -d
    pause
    exit /b 1
)

echo Checking for companies without workshop settings...
echo.

REM Check how many companies need settings
docker-compose exec -T postgres psql -U fsm_user -d fsm_db -c "SELECT COUNT(*) as companies_without_settings FROM companies c WHERE NOT EXISTS (SELECT 1 FROM workshop_settings ws WHERE ws.company_id = c.id);"

echo.
echo Seeding workshop settings...
echo.

REM Run the seed script
docker-compose exec -T postgres psql -U fsm_user -d fsm_db < database/migrations/004_seed_workshop_settings.sql

if errorlevel 1 (
    echo.
    echo ERROR: Seeding failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo Seeding completed successfully!
echo ============================================================================
echo.
echo Verifying workshop settings...
echo.

REM Verify the settings
docker-compose exec -T postgres psql -U fsm_user -d fsm_db -c "SELECT c.name as company_name, ws.max_concurrent_jobs, ws.max_jobs_per_technician, ws.default_estimated_repair_hours FROM companies c INNER JOIN workshop_settings ws ON c.id = ws.company_id;"

echo.
echo ============================================================================
echo All companies now have workshop settings configured!
echo ============================================================================
echo.
pause
