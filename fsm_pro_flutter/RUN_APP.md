# Run the App - Quick Reference

## 🚀 Start the App

```bash
cd fsm_pro_flutter
flutter run
```

## 🔐 Login

**Your Credentials:**
- Email: `fadi@gmail.com`
- Password: `[your password]`

## ✅ What Should Happen

1. **App starts** → Shows API configuration in logs
2. **Login screen** → Enter credentials
3. **Tap Login** → See detailed logs
4. **Success** → Navigate to home screen
5. **Load data** → Work orders, profile, etc.

## 📋 Expected Logs

```
🚀 FSM Pro Mobile App Starting...
📍 Base URL: https://fsmpro.phishsimulator.com/api

[After login:]
📤 API Request: POST .../auth/login
📥 API Response: 200
✅ Login successful!
```

## ❌ If Login Fails

Check the logs for:
- Connection errors → Backend not running
- 404 errors → User doesn't exist
- 401 errors → Wrong password

## 🧪 Test API First (Optional)

```bash
dart run test_api_connection.dart
```

This verifies the backend is accessible.

## 📚 More Info

- **QUICK_START.md** - Detailed testing guide
- **FINAL_FIX_SUMMARY.md** - Complete fix summary
- **DEBUG_LOGGING_GUIDE.md** - Understanding logs

## 🎉 That's It!

The app is ready. Just run it and login!
