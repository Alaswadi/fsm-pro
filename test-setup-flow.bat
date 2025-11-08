@echo off
echo ============================================================================
echo Testing Setup Wizard Flow
echo ============================================================================
echo.

echo Step 1: Check if setup is needed...
echo.
curl -s https://fsmpro.phishsimulator.com/api/setup/check
echo.
echo.

echo Step 2: Initialize setup with test data...
echo.
curl -X POST https://fsmpro.phishsimulator.com/api/setup/initialize ^
  -H "Content-Type: application/json" ^
  -d "{\"adminEmail\":\"admin@testcompany.com\",\"adminPassword\":\"Admin123!\",\"adminFullName\":\"Test Admin\",\"adminPhone\":\"+1-555-0100\",\"companyName\":\"Test Company\",\"companyAddress\":\"123 Test St\",\"companyPhone\":\"+1-555-0200\",\"companyEmail\":\"info@testcompany.com\",\"timezone\":\"America/New_York\",\"currency\":\"USD\",\"dateFormat\":\"MM/DD/YYYY\"}"
echo.
echo.

echo Step 3: Verify setup is no longer needed...
echo.
curl -s https://fsmpro.phishsimulator.com/api/setup/check
echo.
echo.

echo Step 4: Verify user was created...
echo.
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT email, full_name, role FROM users;"
echo.

echo Step 5: Verify company was created...
echo.
docker exec -it fsm-postgres-coolify psql -U fsm_user -d fsm_db -c "SELECT name, email FROM companies;"
echo.

echo ============================================================================
echo Test Complete!
echo.
echo Now try:
echo 1. Visit https://fsmpro.phishsimulator.com
echo 2. Should show login page (NOT setup wizard)
echo 3. Login with: admin@testcompany.com / Admin123!
echo ============================================================================
pause

