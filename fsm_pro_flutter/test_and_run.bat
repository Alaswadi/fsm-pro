@echo off
echo ========================================
echo FSM Pro - Test API and Run App
echo ========================================
echo.

echo Step 1: Testing API Connection...
echo ----------------------------------------
call dart run test_api_connection.dart
echo.
echo.

echo Step 2: Press any key to run the app...
pause
echo.

echo Step 3: Running Flutter App...
echo ----------------------------------------
echo Watch the console for detailed logs!
echo.
call flutter run

pause
