@echo off
REM Test Production API Script
echo ============================================================================
echo Testing Production API: https://fsmproapi.phishsimulator.com
echo ============================================================================
echo.

echo 1. Testing Health Endpoint...
echo.
curl -s https://fsmproapi.phishsimulator.com/api/health
echo.
echo.

echo 2. Testing Root Endpoint...
echo.
curl -s https://fsmproapi.phishsimulator.com/
echo.
echo.

echo 3. Testing Login Endpoint (this might timeout if DB is not connected)...
echo.
curl -X POST https://fsmproapi.phishsimulator.com/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"mobile.tech@fsm.com\",\"password\":\"mobile123\"}" --max-time 10
echo.
echo.

echo ============================================================================
echo Test Complete
echo.
echo If login timed out or returned 500 error, your production server needs:
echo   1. Database to be running and accessible
echo   2. Database tables to be created (run migrations)
echo   3. Seed data to be inserted (create test users)
echo   4. Environment variables to be properly configured
echo ============================================================================
pause

