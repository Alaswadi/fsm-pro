@echo off
echo ============================================================================
echo Rolling Back Workshop/Depot Repair Migration
echo ============================================================================
echo.
echo WARNING: This will delete all workshop-related data!
echo.
set /p confirm="Are you sure you want to rollback? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo Rollback cancelled.
    pause
    exit /b 0
)

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

echo Applying rollback...
echo.

REM Run the rollback using docker-compose
docker-compose exec -T postgres psql -U fsm_user -d fsm_db < database/migrations/workshop_migration_rollback.sql

if errorlevel 1 (
    echo.
    echo ERROR: Rollback failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo Rollback completed successfully!
echo ============================================================================
echo.
echo Step 2: Verifying rollback...
echo.

REM Verify the tables are removed
echo Checking for workshop tables (should be empty)...
docker-compose exec -T postgres psql -U fsm_user -d fsm_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('equipment_intake', 'equipment_status', 'equipment_status_history', 'intake_photos', 'workshop_settings') ORDER BY table_name;"

echo.
echo Checking jobs table columns (workshop fields should be removed)...
docker-compose exec -T postgres psql -U fsm_user -d fsm_db -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs' AND column_name IN ('location_type', 'estimated_completion_date', 'pickup_delivery_fee', 'delivery_scheduled_date', 'delivery_technician_id');"

echo.
echo ============================================================================
echo Rollback verification complete!
echo ============================================================================
echo.
echo All workshop-related tables and fields have been removed.
echo.
pause
