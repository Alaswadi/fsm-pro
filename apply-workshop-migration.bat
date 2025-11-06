@echo off
echo ============================================================================
echo Applying Workshop/Depot Repair Migration
echo ============================================================================
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

echo Step 1: Applying workshop migration...
echo.

REM Run the migration using docker-compose
docker-compose exec -T postgres psql -U fsm_user -d fsm_db < database/migrations/workshop_migration.sql

if errorlevel 1 (
    echo.
    echo ERROR: Migration failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo Migration completed successfully!
echo ============================================================================
echo.
echo Step 2: Verifying migration...
echo.

REM Verify the jobs table changes
echo Checking jobs table columns...
docker-compose exec -T postgres psql -U fsm_user -d fsm_db -c "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'jobs' AND column_name IN ('location_type', 'estimated_completion_date', 'pickup_delivery_fee', 'delivery_scheduled_date', 'delivery_technician_id') ORDER BY column_name;"

echo.
echo Checking workshop tables...
docker-compose exec -T postgres psql -U fsm_user -d fsm_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('equipment_intake', 'equipment_status', 'equipment_status_history', 'intake_photos', 'workshop_settings') ORDER BY table_name;"

echo.
echo Checking workshop settings records...
docker-compose exec -T postgres psql -U fsm_user -d fsm_db -c "SELECT company_id, max_concurrent_jobs, max_jobs_per_technician, default_estimated_repair_hours FROM workshop_settings;"

echo.
echo ============================================================================
echo Migration verification complete!
echo ============================================================================
echo.
echo The following changes have been applied:
echo   - Extended jobs table with workshop fields
echo   - Created equipment_intake table
echo   - Created equipment_status table
echo   - Created equipment_status_history table
echo   - Created intake_photos table
echo   - Created workshop_settings table
echo   - Seeded default workshop settings for existing companies
echo.
echo To rollback this migration, run: apply-workshop-rollback.bat
echo.
pause
