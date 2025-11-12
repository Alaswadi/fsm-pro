# Flutter App Installation Guide

## Current Status
✅ API Configuration Updated: `https://fsmproapi.phishsimulator.com`
✅ Code Analysis Passed: No errors found
⚠️ Build Issue: Windows file locking problem with MaterialIcons font

## The Problem
Windows is locking the MaterialIcons-Regular.otf file during the build process, preventing Flutter from copying it. This is a common Windows issue with Flutter builds.

## Solutions

### Solution 1: Enable Developer Mode (Recommended)
1. Press `Win + I` to open Settings
2. Go to **Privacy & Security** → **For developers**
3. Turn on **Developer Mode**
4. Restart your computer
5. Run: `flutter run -d emulator-5554`

### Solution 2: Run as Administrator
1. Close all Flutter/Android Studio/VS Code instances
2. Open Command Prompt or PowerShell as Administrator
3. Navigate to the project: `cd "C:\Users\fadia\Documents\augment-projects\fsm-pro - Copy\fsm_pro_flutter"`
4. Run: `flutter clean`
5. Run: `flutter pub get`
6. Run: `flutter run -d emulator-5554`

### Solution 3: Manual APK Build and Install
1. Close all development tools
2. Restart your computer to release file locks
3. Open Command Prompt as Administrator
4. Navigate to project directory
5. Run these commands:
```cmd
flutter clean
flutter pub get
flutter build apk --release
adb install build\app\outputs\flutter-apk\app-release.apk
```

### Solution 4: Use Android Studio
1. Open the project in Android Studio
2. Let Android Studio sync and index the project
3. Click the green "Run" button
4. Select your emulator (sdk gphone64 x86 64)
5. Android Studio handles the build differently and may avoid the lock

## Verify API Connection

Once the app is installed, test the API connection:

### Test Login
1. Open the app on the emulator
2. Try logging in with test credentials
3. Check the network logs in the emulator

### Check API Endpoint
The app is configured to connect to:
```
Base URL: https://fsmproapi.phishsimulator.com
```

### API Endpoints Being Used
- POST `/auth/login` - Login
- GET `/jobs` - Work orders
- GET `/inventory` - Inventory items
- GET `/workshop/queue` - Workshop queue
- And more...

## Manual Testing Steps

1. **Login Screen**
   - Enter credentials
   - Verify connection to API
   - Check for proper error messages

2. **Work Orders**
   - View list of work orders
   - Open work order details
   - Update work order status

3. **Workshop Queue**
   - View workshop queue
   - Claim jobs
   - Track equipment status

4. **Inventory**
   - View inventory items
   - Check stock levels

5. **Profile**
   - View user profile
   - Update settings
   - Test logout

## Debugging API Calls

### View Network Logs
```cmd
adb logcat -s flutter
```

### Check for API Errors
Look for these in the logs:
- Connection timeout
- 401 Unauthorized
- 404 Not Found
- Network errors

### Test API Directly
You can test the API using curl or Postman:
```bash
curl -X POST https://fsmproapi.phishsimulator.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Current Emulator
- Device: sdk gphone64 x86 64
- ID: emulator-5554
- OS: Android 16 (API 36)

## Next Steps
1. Try Solution 1 (Enable Developer Mode) first
2. If that doesn't work, try Solution 2 (Run as Administrator)
3. Once installed, follow the Manual Testing Steps
4. Report any API connection issues

## Notes
- The app has offline mode support
- Authentication tokens are stored securely
- All API calls include proper error handling
- Network timeouts are set to 30 seconds
