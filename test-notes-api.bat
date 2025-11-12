@echo off
echo Testing Notes API Endpoint
echo ===========================
echo.
echo This script tests the PATCH /api/jobs/:id/status endpoint with notes
echo.
echo Prerequisites:
echo 1. API server must be running
echo 2. You must have a valid auth token
echo 3. You must have a valid job ID
echo.
echo Usage:
echo   curl -X PATCH http://localhost:3000/api/jobs/YOUR_JOB_ID/status ^
echo        -H "Content-Type: application/json" ^
echo        -H "Authorization: Bearer YOUR_TOKEN" ^
echo        -d "{\"status\":\"in_progress\",\"notes\":\"Test note from API\"}"
echo.
pause
