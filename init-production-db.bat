@echo off
REM Initialize Production Database for FSM Pro
REM This script creates all tables and inserts seed data

echo ==========================================
echo FSM Pro - Production Database Initialization
echo ==========================================
echo.

REM Check if docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running
    echo Please start Docker Desktop first
    pause
    exit /b 1
)

REM Check if postgres container is running
docker ps | findstr "fsm-postgres-coolify" >nul
if errorlevel 1 (
    echo ERROR: PostgreSQL container fsm-postgres-coolify is not running
    echo.
    echo Please start the services first:
    echo   docker-compose -f docker-compose.coolify.yml up -d
    echo.
    pause
    exit /b 1
)

echo [OK] PostgreSQL container is running
echo.

REM Load environment variables from .env file
if not exist .env (
    echo ERROR: .env file not found
    pause
    exit /b 1
)

REM Read DB credentials from .env
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr /v "^#"') do (
    if "%%a"=="DB_NAME" set DB_NAME=%%b
    if "%%a"=="DB_USER" set DB_USER=%%b
    if "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
)

REM Set defaults if not found
if not defined DB_NAME set DB_NAME=fsm_db
if not defined DB_USER set DB_USER=fsm_user
if not defined DB_PASSWORD set DB_PASSWORD=fsm_password

echo Database Configuration:
echo   Database: %DB_NAME%
echo   User: %DB_USER%
echo.

REM Step 1: Check database connection
echo Step 1: Checking database connection...
docker exec -i fsm-postgres-coolify psql -U %DB_USER% -d %DB_NAME% -c "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Cannot connect to database
    pause
    exit /b 1
)
echo [OK] Database connection successful
echo.

REM Step 2: Check if tables exist
echo Step 2: Checking if tables exist...
for /f %%i in ('docker exec -i fsm-postgres-coolify psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"') do set TABLE_COUNT=%%i

if %TABLE_COUNT% GTR 0 (
    echo WARNING: Database already has %TABLE_COUNT% tables
    echo.
    set /p CONFIRM="Do you want to DROP all tables and recreate them? (yes/no): "
    if /i "!CONFIRM!"=="yes" (
        echo Dropping all tables...
        docker exec -i fsm-postgres-coolify psql -U %DB_USER% -d %DB_NAME% -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        echo [OK] All tables dropped
    ) else (
        echo Skipping table creation
    )
) else (
    echo [OK] Database is empty, ready for initialization
)
echo.

REM Step 3: Create tables
echo Step 3: Creating database tables...
docker exec -i fsm-postgres-coolify psql -U %DB_USER% -d %DB_NAME% < database\init.sql
if errorlevel 1 (
    echo ERROR: Failed to create tables
    pause
    exit /b 1
)
echo [OK] Database tables created successfully
echo.

REM Step 4: Verify tables
echo Step 4: Verifying tables...
for /f %%i in ('docker exec -i fsm-postgres-coolify psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"') do set TABLE_COUNT=%%i
echo [OK] Created %TABLE_COUNT% tables
echo.

REM Step 5: List tables
echo Step 5: Listing all tables...
docker exec -i fsm-postgres-coolify psql -U %DB_USER% -d %DB_NAME% -c "\dt"
echo.

REM Step 6: Check users
echo Step 6: Checking for default users...
for /f %%i in ('docker exec -i fsm-postgres-coolify psql -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM users;"') do set USER_COUNT=%%i

if %USER_COUNT% GTR 0 (
    echo [OK] Found %USER_COUNT% users in database
) else (
    echo WARNING: No users found
    echo Default users should have been created by init.sql
)
echo.

REM Display completion message
echo ==========================================
echo Database Initialization Complete!
echo ==========================================
echo.
echo Default Login Credentials:
echo.
echo Admin Account:
echo   Email: admin@fsm.com
echo   Password: admin123
echo.
echo Technician Account:
echo   Email: mobile.tech@fsm.com
echo   Password: mobile123
echo.
echo WARNING: Change these passwords after first login!
echo.
echo Next Steps:
echo 1. Restart the API service:
echo    docker-compose -f docker-compose.coolify.yml restart api
echo.
echo 2. Test the API:
echo    curl https://fsmpro.phishsimulator.com/api/health
echo.
echo 3. Try logging in:
echo    - Admin: https://fsmpro.phishsimulator.com/
echo    - Mobile: Use Expo Go app
echo.
echo ==========================================
echo.
pause

