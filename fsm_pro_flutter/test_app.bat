@echo off
REM FSM Pro Flutter App - Quick Test Script for Windows
REM This script helps test the app on connected Android devices

echo ========================================
echo FSM Pro Flutter App - Test Script
echo ========================================
echo.

REM Check if Flutter is installed
echo [1/6] Checking Flutter installation...
flutter --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Flutter is not installed or not in PATH
    exit /b 1
)
echo OK: Flutter is installed
echo.

REM Check for connected devices
echo [2/6] Checking for connected devices...
flutter devices
if %errorlevel% neq 0 (
    echo ERROR: No devices found
    echo Please connect an Android device or start an emulator
    exit /b 1
)
echo.

REM Run Flutter analyze
echo [3/6] Running code analysis...
flutter analyze
echo.

REM Clean previous build
echo [4/6] Cleaning previous build...
flutter clean
flutter pub get
echo.

REM Build debug APK
echo [5/6] Building debug APK...
flutter build apk --debug
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    exit /b 1
)
echo OK: Debug APK built successfully
echo.

REM Show APK location
echo [6/6] Build complete!
echo.
echo APK Location: build\app\outputs\flutter-apk\app-debug.apk
echo.

REM Ask if user wants to install
set /p install="Do you want to install the app on connected device? (y/n): "
if /i "%install%"=="y" (
    echo.
    echo Installing app...
    adb devices
    echo.
    set /p device="Enter device ID (or press Enter for first device): "
    if "%device%"=="" (
        adb install -r build\app\outputs\flutter-apk\app-debug.apk
    ) else (
        adb -s %device% install -r build\app\outputs\flutter-apk\app-debug.apk
    )
    
    if %errorlevel% equ 0 (
        echo.
        echo Installation successful!
        echo.
        set /p launch="Do you want to launch the app? (y/n): "
        if /i "!launch!"=="y" (
            if "%device%"=="" (
                adb shell am start -n com.fsmpro.mobile/.MainActivity
            ) else (
                adb -s %device% shell am start -n com.fsmpro.mobile/.MainActivity
            )
            echo.
            echo App launched!
            echo.
            echo To view logs, run: adb logcat -s flutter
        )
    ) else (
        echo.
        echo Installation failed!
    )
)

echo.
echo ========================================
echo Test script completed
echo ========================================
echo.
echo Next steps:
echo 1. Test the app manually on the device
echo 2. Check TESTING_REPORT.md for test checklist
echo 3. Check PHYSICAL_DEVICE_TESTING.md for detailed testing guide
echo.
pause
