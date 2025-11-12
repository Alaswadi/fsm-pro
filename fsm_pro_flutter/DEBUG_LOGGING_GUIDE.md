# Debug Logging Guide - API Connection Issues

## Overview

Comprehensive logging has been added throughout the app to help diagnose API connection issues. All logs will appear in your Flutter console/terminal when running the app.

## What Was Added

### 1. API Configuration Logging (Startup)
**Location:** `lib/main.dart` and `lib/core/constants/api_constants.dart`

When the app starts, you'll see:
```
🚀 FSM Pro Mobile App Starting...
═══════════════════════════════════════════════════
🚀 FSM Pro API Configuration
═══════════════════════════════════════════════════
📍 Base URL: https://fsmproapi.phishsimulator.com
⏱️  Timeout: 30s
🔐 Login endpoint: https://fsmproapi.phishsimulator.com/auth/login
📋 Jobs endpoint: https://fsmproapi.phishsimulator.com/jobs
═══════════════════════════════════════════════════
```

### 2. API Service Logging
**Location:** `lib/data/services/api_service.dart`

**Every API Request:**
```
📤 API Request: POST https://fsmproapi.phishsimulator.com/auth/login
   Headers: {Content-Type: application/json, Accept: application/json}
   Data: [LOGIN DATA HIDDEN]
   Auth: Token added (if available)
```

**Every API Response:**
```
📥 API Response: 200 https://fsmproapi.phishsimulator.com/auth/login
   Data: {token: ..., user: {...}}
```

**Every API Error:**
```
❌ API Error: https://fsmproapi.phishsimulator.com/auth/login
   Type: DioExceptionType.connectionError
   Message: Connection refused
   Status: null
   Data: null
   Action: [any action taken]
```

### 3. Repository Logging
**Location:** `lib/data/repositories/auth_repository.dart`

```
📦 AuthRepository: Validating login inputs
📦 AuthRepository: Calling API service login
✅ AuthRepository: Login successful
```

Or on error:
```
❌ AuthRepository: NetworkException - Unable to connect to server
```

### 4. Provider Logging
**Location:** `lib/providers/auth_provider.dart`

```
👤 AuthProvider: Starting login for user@example.com
✅ AuthProvider: Login successful
```

Or on error:
```
❌ AuthProvider: Login failed - Unable to connect to server
```

## How to View Logs

### Option 1: Flutter Run (Recommended)
```bash
cd fsm_pro_flutter
flutter run
```

All logs will appear in your terminal in real-time.

### Option 2: Android Studio / VS Code
- Open the "Run" or "Debug Console" tab
- All logs will appear there when you run the app

### Option 3: ADB Logcat (Android Only)
```bash
adb logcat | grep -E "flutter|FSM"
```

## Testing API Connection

### Step 1: Run the API Test Script
```bash
cd fsm_pro_flutter
dart run test_api_connection.dart
```

This will test:
1. DNS resolution and basic connectivity
2. Login endpoint with test credentials
3. Authenticated requests (work orders)
4. Profile endpoint

### Step 2: Run the App and Watch Logs
```bash
flutter run
```

Then try to login and watch the console for:
1. API configuration on startup
2. Login request details
3. Response or error information

## Common Error Patterns

### Pattern 1: Connection Refused
```
❌ API Error: https://fsmproapi.phishsimulator.com/auth/login
   Type: DioExceptionType.connectionError
   Message: Connection refused
```

**Cause:** Backend server is not running or not accessible
**Solution:** 
- Verify the backend is running
- Check if you can access the URL in a browser
- Ensure no firewall is blocking the connection

### Pattern 2: Connection Timeout
```
❌ API Error: https://fsmproapi.phishsimulator.com/auth/login
   Type: DioExceptionType.connectionTimeout
   Message: Connection timeout
```

**Cause:** Server is taking too long to respond
**Solution:**
- Check your internet connection
- Verify the server is responding (use test script)
- Check if the server is under heavy load

### Pattern 3: DNS Resolution Failed
```
❌ API Error: https://fsmproapi.phishsimulator.com/auth/login
   Type: DioExceptionType.connectionError
   Message: Failed host lookup
```

**Cause:** Cannot resolve the domain name
**Solution:**
- Check your internet connection
- Verify the domain exists and is accessible
- Try accessing the URL in a browser

### Pattern 4: 401 Unauthorized
```
📥 API Response: 401 https://fsmproapi.phishsimulator.com/auth/login
   Data: {error: Invalid credentials}
```

**Cause:** Invalid login credentials
**Solution:**
- Verify the email and password are correct
- Check if the user exists in the backend database

### Pattern 5: 404 Not Found
```
📥 API Response: 404 https://fsmproapi.phishsimulator.com/auth/login
   Data: {error: Not found}
```

**Cause:** API endpoint path is incorrect
**Solution:**
- Verify the API endpoint paths in `api_constants.dart`
- Check the backend route configuration

## Debugging Workflow

### Step 1: Check API Configuration
Look for the startup logs:
```
🚀 FSM Pro API Configuration
📍 Base URL: https://fsmproapi.phishsimulator.com
```

Verify the URL is correct.

### Step 2: Test API Connection
Run the test script:
```bash
dart run test_api_connection.dart
```

This will tell you if the backend is accessible.

### Step 3: Try Login in App
1. Run the app: `flutter run`
2. Enter credentials and tap Login
3. Watch the console for the full request/response flow

### Step 4: Analyze the Logs
Look for the sequence:
1. `👤 AuthProvider: Starting login`
2. `📦 AuthRepository: Calling API service login`
3. `🔐 Attempting login`
4. `📤 API Request: POST /auth/login`
5. Either:
   - `📥 API Response: 200` (success)
   - `❌ API Error` (failure)

## Current Configuration

**API Base URL:** `https://fsmproapi.phishsimulator.com`

**Endpoints:**
- Login: `/auth/login`
- Profile: `/auth/profile`
- Work Orders: `/jobs`
- Inventory: `/inventory`
- Workshop: `/workshop/queue`

**Test Credentials:**
- Email: `admin@fsmproapi.phishsimulator.com`
- Password: `Admin@123`

## Next Steps

1. **Run the test script** to verify backend connectivity
2. **Run the app** and attempt login
3. **Copy all console logs** from startup to login attempt
4. **Share the logs** for further diagnosis if issues persist

## Disabling Logs (Production)

To disable debug logs in production, the app uses Flutter's `debugPrint()` which automatically gets stripped in release builds. No action needed.

## Additional Tools

### Check Network Connectivity
```bash
# Ping the domain
ping fsmproapi.phishsimulator.com

# Test HTTPS connection
curl -v https://fsmproapi.phishsimulator.com/auth/login
```

### Check from Device/Emulator
If using an Android emulator, you can test from within:
```bash
adb shell
ping fsmproapi.phishsimulator.com
```

## Support

If you're still experiencing issues after reviewing the logs:
1. Run `dart run test_api_connection.dart` and save the output
2. Run the app and save all console logs from startup to login
3. Check if the backend server logs show any incoming requests
4. Verify network permissions in AndroidManifest.xml and Info.plist
