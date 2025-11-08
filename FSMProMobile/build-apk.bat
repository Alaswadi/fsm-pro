@echo off
REM FSM Pro Mobile - APK Build Script
REM This script helps build the production APK

echo ============================================================================
echo FSM Pro Mobile - Production APK Builder
echo ============================================================================
echo.
echo This will build a production APK that connects to:
echo API: https://fsmproapi.phishsimulator.com/api
echo.

REM Check if EAS CLI is installed
where eas >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: EAS CLI is not installed
    echo.
    echo Please install it first:
    echo    npm install -g eas-cli
    echo.
    pause
    exit /b 1
)

echo EAS CLI is installed ✓
echo.

REM Navigate to mobile app directory
cd /d "%~dp0"

echo Choose build type:
echo.
echo 1. Production Build (for distribution)
echo 2. Preview Build (for testing)
echo 3. Development Build (with dev features)
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    set profile=production
    echo.
    echo Building PRODUCTION APK...
) else if "%choice%"=="2" (
    set profile=preview
    echo.
    echo Building PREVIEW APK...
) else if "%choice%"=="3" (
    set profile=development
    echo.
    echo Building DEVELOPMENT APK...
) else (
    echo Invalid choice. Exiting.
    pause
    exit /b 1
)

echo.
echo Starting build with profile: %profile%
echo.
echo This will:
echo   1. Upload your code to Expo servers
echo   2. Build the APK in the cloud
echo   3. Provide a download link when complete
echo.
echo This may take 10-20 minutes...
echo.

eas build --platform android --profile %profile%

echo.
echo ============================================================================
echo Build process initiated!
echo.
echo You can:
echo   - Track progress at: https://expo.dev
echo   - Download the APK when complete
echo   - Install on Android devices
echo.
echo Default login credentials:
echo   Email: mobile.tech@fsm.com
echo   Password: mobile123
echo ============================================================================
echo.
pause

