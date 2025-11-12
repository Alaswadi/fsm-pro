# Physical Device Testing Guide

## Quick Start - Testing on Physical Android Device

### Prerequisites
1. Android device with USB debugging enabled
2. USB cable to connect device to computer
3. ADB drivers installed (usually comes with Android Studio)

### Enable USB Debugging on Android Device

1. **Enable Developer Options**:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - You'll see "You are now a developer!"

2. **Enable USB Debugging**:
   - Go to Settings → System → Developer Options
   - Enable "USB Debugging"
   - Enable "Install via USB" (if available)

3. **Connect Device**:
   - Connect device via USB cable
   - On device, tap "Allow" when prompted for USB debugging authorization
   - Check "Always allow from this computer" (optional)

### Verify Device Connection

```bash
# Check if device is connected
flutter devices

# Or use adb directly
adb devices
```

You should see your device listed with a serial number.

### Install and Run on Physical Device

#### Option 1: Direct Run (Recommended for Development)
```bash
# Navigate to project directory
cd fsm_pro_flutter

# Run on connected device
flutter run
```

This will:
- Build the app
- Install it on your device
- Launch it
- Enable hot reload for development

#### Option 2: Install Pre-built APK
```bash
# Build debug APK
flutter build apk --debug

# Install on device
adb install build/app/outputs/flutter-apk/app-debug.apk

# Launch the app
adb shell am start -n com.fsmpro.mobile/.MainActivity
```

#### Option 3: Build and Install Release APK
```bash
# Build release APK (smaller, optimized)
flutter build apk --release

# Install on device
adb install build/app/outputs/flutter-apk/app-release.apk
```

### Testing Checklist for Physical Device

#### 1. Basic Functionality
- [ ] App installs successfully
- [ ] App launches without crashes
- [ ] Login screen displays correctly
- [ ] All UI elements are visible and properly sized
- [ ] Touch interactions work smoothly
- [ ] Keyboard appears and works correctly

#### 2. Network Testing
- [ ] App connects to backend API over WiFi
- [ ] App connects to backend API over mobile data
- [ ] Test with weak network signal
- [ ] Test with no network (airplane mode)
- [ ] Verify error messages display correctly
- [ ] Test retry functionality after network restored

#### 3. Performance Testing
- [ ] App launches quickly (< 3 seconds)
- [ ] Screen transitions are smooth
- [ ] List scrolling is smooth (60 FPS)
- [ ] Images load efficiently
- [ ] No lag when typing in text fields
- [ ] App doesn't drain battery excessively

#### 4. Authentication Flow
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (verify error)
- [ ] Logout functionality
- [ ] Token persistence (close and reopen app)
- [ ] Auto-login after app restart
- [ ] Session timeout handling

#### 5. Work Orders Module
- [ ] Fetch and display work orders
- [ ] Filter by status (All, Scheduled, In Progress, Completed)
- [ ] Search functionality
- [ ] View work order details
- [ ] Update work order status
- [ ] Pull-to-refresh
- [ ] Navigate back to list

#### 6. Inventory Module
- [ ] Fetch and display inventory items
- [ ] Search functionality
- [ ] Stock level indicators display correctly
- [ ] Colors match stock levels
- [ ] Pull-to-refresh

#### 7. Workshop Module
- [ ] View workshop queue
- [ ] Claim workshop job
- [ ] View equipment status
- [ ] Update equipment status
- [ ] View status history
- [ ] Status transitions work correctly

#### 8. Profile Module
- [ ] Display user information
- [ ] Toggle availability status
- [ ] View today's summary
- [ ] Logout functionality

#### 9. Navigation
- [ ] Bottom navigation works
- [ ] Tab switching is smooth
- [ ] Back button behavior is correct
- [ ] Deep linking (if implemented)

#### 10. Edge Cases
- [ ] Rotate device (portrait/landscape)
- [ ] Minimize and restore app
- [ ] Receive phone call during app use
- [ ] Low battery mode
- [ ] Low storage space
- [ ] Different screen sizes
- [ ] Different Android versions

### Monitoring and Debugging

#### View Real-time Logs
```bash
# View all logs
adb logcat

# View only Flutter logs
adb logcat -s flutter

# View logs with timestamp
adb logcat -v time

# Clear logs and view new ones
adb logcat -c && adb logcat -s flutter
```

#### Check App Performance
```bash
# Monitor CPU and memory usage
adb shell top | grep com.fsmpro.mobile

# Check battery usage
adb shell dumpsys batterystats | grep com.fsmpro.mobile
```

#### Capture Screenshots
```bash
# Take screenshot
adb shell screencap -p /sdcard/screenshot.png

# Pull screenshot to computer
adb pull /sdcard/screenshot.png
```

#### Record Screen Video
```bash
# Start recording (max 3 minutes)
adb shell screenrecord /sdcard/demo.mp4

# Stop recording (Ctrl+C)

# Pull video to computer
adb pull /sdcard/demo.mp4
```

### Common Issues and Solutions

#### Issue: Device Not Detected
**Solution**:
```bash
# Restart adb server
adb kill-server
adb start-server

# Check USB connection mode (should be "File Transfer" or "PTP")
# Try different USB cable
# Try different USB port
```

#### Issue: Installation Failed
**Solution**:
```bash
# Uninstall existing app
adb uninstall com.fsmpro.mobile

# Clear app data
adb shell pm clear com.fsmpro.mobile

# Reinstall
adb install build/app/outputs/flutter-apk/app-debug.apk
```

#### Issue: App Crashes on Launch
**Solution**:
```bash
# View crash logs
adb logcat -s flutter AndroidRuntime

# Check for missing permissions in AndroidManifest.xml
# Verify all dependencies are properly installed
```

#### Issue: Network Requests Fail
**Solution**:
- Verify device has internet connection
- Check if backend API is accessible from device's network
- Verify API URL is correct (not localhost)
- Check for SSL certificate issues
- Verify required permissions in AndroidManifest.xml

### Testing Different Scenarios

#### Test Network Errors
1. **No Internet**:
   - Enable airplane mode
   - Try to login or fetch data
   - Verify error message displays
   - Disable airplane mode
   - Verify retry works

2. **Slow Network**:
   - Use Chrome DevTools to throttle network (if using proxy)
   - Or use apps like "Network Speed Limiter"
   - Verify loading indicators display
   - Verify timeout handling (30 seconds)

3. **API Errors**:
   - Test with invalid credentials
   - Test with expired token
   - Test with non-existent resources
   - Verify appropriate error messages

#### Test Authentication
1. **Valid Login**:
   ```
   Email: technician@example.com
   Password: password123
   ```

2. **Invalid Login**:
   ```
   Email: invalid@example.com
   Password: wrongpassword
   ```

3. **Token Persistence**:
   - Login successfully
   - Close app completely
   - Reopen app
   - Verify auto-login

#### Test Data Loading
1. **Empty States**:
   - Test with account that has no work orders
   - Test with empty inventory
   - Verify empty state messages

2. **Large Data Sets**:
   - Test with account that has many work orders
   - Verify list scrolling performance
   - Verify pagination (if implemented)

3. **Data Refresh**:
   - Pull-to-refresh on each screen
   - Verify data updates
   - Verify loading indicators

### Performance Benchmarks

#### Target Metrics
- **App Launch Time**: < 3 seconds (cold start)
- **Screen Transition**: < 300ms
- **API Response Handling**: < 1 second (after API responds)
- **List Scrolling**: 60 FPS
- **Memory Usage**: < 200 MB
- **Battery Drain**: < 5% per hour of active use

#### Measuring Performance
```bash
# Check app startup time
adb shell am start -W com.fsmpro.mobile/.MainActivity

# Monitor FPS
# Enable "Profile GPU Rendering" in Developer Options
# Look for bars below the green line (16ms = 60 FPS)

# Check memory usage
adb shell dumpsys meminfo com.fsmpro.mobile
```

### Test Report Template

After testing on physical device, document results:

```markdown
## Physical Device Test Report

**Device Information**:
- Model: [e.g., Samsung Galaxy S21]
- Android Version: [e.g., Android 13]
- Screen Size: [e.g., 6.2 inches]
- Resolution: [e.g., 1080 x 2400]

**Test Date**: [Date]
**Tester**: [Name]
**App Version**: 1.0.0+1

**Test Results**:
- [ ] Installation: Pass/Fail
- [ ] Launch: Pass/Fail
- [ ] Authentication: Pass/Fail
- [ ] Work Orders: Pass/Fail
- [ ] Inventory: Pass/Fail
- [ ] Workshop: Pass/Fail
- [ ] Profile: Pass/Fail
- [ ] Network Errors: Pass/Fail
- [ ] Performance: Pass/Fail

**Issues Found**:
1. [Description of issue]
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce
   - Expected behavior
   - Actual behavior

**Performance Notes**:
- App launch time: [X seconds]
- Memory usage: [X MB]
- Battery drain: [X% per hour]
- Scrolling performance: [Smooth/Laggy]

**Overall Assessment**: [Pass/Fail/Pass with Issues]
```

### Next Steps After Physical Device Testing

1. **Document Issues**: Create detailed bug reports for any issues found
2. **Fix Critical Bugs**: Address any crashes or blocking issues
3. **Optimize Performance**: Improve any performance bottlenecks
4. **Test on Multiple Devices**: Test on different Android versions and screen sizes
5. **Prepare Release Build**: Create signed release APK for production
6. **Beta Testing**: Distribute to beta testers for wider testing
7. **Play Store Submission**: Submit to Google Play Store when ready

### Additional Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Android Debug Bridge (ADB)](https://developer.android.com/studio/command-line/adb)
- [Flutter Performance Best Practices](https://flutter.dev/docs/perf/best-practices)
- [Android Testing Guide](https://developer.android.com/training/testing)

---

**Note**: Always test on multiple physical devices with different Android versions and screen sizes before releasing to production.
