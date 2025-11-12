@echo off
echo ========================================
echo FSM Pro Flutter - Rebuild and Test
echo ========================================
echo.

echo Step 1: Cleaning project...
call flutter clean
if errorlevel 1 (
    echo ERROR: Flutter clean failed
    pause
    exit /b 1
)
echo.

echo Step 2: Getting dependencies...
call flutter pub get
if errorlevel 1 (
    echo ERROR: Flutter pub get failed
    pause
    exit /b 1
)
echo.

echo Step 3: Testing API connection...
call dart run test_api_connection.dart
echo.

echo Step 4: Building and running app...
echo Make sure your device/emulator is connected!
echo.
call flutter run
if errorlevel 1 (
    echo ERROR: Flutter run failed
    pause
    exit /b 1
)

pause
