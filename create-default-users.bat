@echo off
REM Create Default Users via API

echo ==========================================
echo Creating Default Users for FSM Pro
echo ==========================================
echo.

set API_URL=https://fsmpro.phishsimulator.com/api

REM Step 1: Create Admin User
echo Step 1: Creating Admin User...
curl -s -X POST "%API_URL%/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@fsm.com\",\"password\":\"admin123\",\"full_name\":\"Admin User\",\"role\":\"admin\"}"
echo.
echo [OK] Admin user creation attempted
echo    Email: admin@fsm.com
echo    Password: admin123
echo.

REM Step 2: Create Mobile Technician User
echo Step 2: Creating Mobile Technician User...
curl -s -X POST "%API_URL%/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"mobile.tech@fsm.com\",\"password\":\"mobile123\",\"full_name\":\"Mobile Technician\",\"phone\":\"+1-555-0101\",\"role\":\"technician\"}"
echo.
echo [OK] Mobile technician user creation attempted
echo    Email: mobile.tech@fsm.com
echo    Password: mobile123
echo.

REM Step 3: Test Admin Login
echo Step 3: Testing Admin Login...
curl -s -X POST "%API_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@fsm.com\",\"password\":\"admin123\"}"
echo.
echo.

REM Step 4: Test Mobile Tech Login
echo Step 4: Testing Mobile Tech Login...
curl -s -X POST "%API_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"mobile.tech@fsm.com\",\"password\":\"mobile123\"}"
echo.
echo.

REM Summary
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Default Login Credentials:
echo.
echo Admin Account:
echo   URL: https://fsmpro.phishsimulator.com/
echo   Email: admin@fsm.com
echo   Password: admin123
echo.
echo Mobile Technician Account:
echo   Email: mobile.tech@fsm.com
echo   Password: mobile123
echo.
echo WARNING: Change these passwords after first login!
echo.
echo Next Steps:
echo 1. Login to admin app: https://fsmpro.phishsimulator.com/
echo 2. Test mobile app with Expo Go
echo 3. Change default passwords in Settings
echo.
echo ==========================================
echo.
pause

