# FSM Pro Mobile - Build Instructions

## 🚀 Building Production APK

This guide will help you build a production-ready APK that connects to your production API at `https://fsmproapi.phishsimulator.com/api`.

### Prerequisites

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to your Expo account:**
   ```bash
   eas login
   ```
   
   If you don't have an Expo account, create one at https://expo.dev/signup

3. **Configure your project (first time only):**
   ```bash
   cd FSMProMobile
   eas build:configure
   ```

### Building the APK

#### Option 1: Production Build (Recommended)
This will create a production APK that connects to `https://fsmpro.phishsimulator.com/api`:

```bash
cd FSMProMobile
eas build --platform android --profile production
```

#### Option 2: Preview Build (For Testing)
This creates an APK for internal testing:

```bash
cd FSMProMobile
eas build --platform android --profile preview
```

### Build Process

1. **EAS will ask you some questions:**
   - "Would you like to automatically create an EAS project?" → **Yes**
   - "Generate a new Android Keystore?" → **Yes** (first time only)

2. **Wait for the build:**
   - The build happens on Expo's servers
   - You'll see a URL to track the build progress
   - Build typically takes 10-20 minutes

3. **Download the APK:**
   - Once complete, you'll get a download link
   - Or visit https://expo.dev/accounts/[your-account]/projects/fsmpromobile/builds

### Installing the APK

#### On Physical Device:
1. Download the APK to your Android device
2. Enable "Install from Unknown Sources" in Settings
3. Open the APK file and install

#### Using ADB:
```bash
adb install path/to/your-app.apk
```

### Build Profiles Explained

- **development**: For development with Expo Go features
- **preview**: Internal testing build (APK format)
- **production**: Production-ready build for distribution

### Configuration Files

- **eas.json**: Build configuration
- **app.json**: App metadata and settings
- **src/services/api.ts**: API endpoint configuration
  - Development: `http://localhost:3001/api` or `http://192.168.0.59:3001/api`
  - Production: `https://fsmpro.phishsimulator.com/api`

### Troubleshooting

#### Build Fails
- Check your internet connection
- Ensure all dependencies are installed: `npm install`
- Check build logs on Expo dashboard

#### APK Won't Install
- Enable "Install from Unknown Sources"
- Check Android version compatibility (minimum SDK 21)

#### Can't Connect to API
- Verify the API is running at `https://fsmproapi.phishsimulator.com/api`
- Check your device has internet connection
- Test the API endpoint in a browser

### Testing the Production Build

1. **Install the APK** on your Android device
2. **Open the app**
3. **Try logging in** with a technician account:
   - Email: mobile.tech@fsm.com
   - Password: mobile123
4. **Verify** it connects to the production API

### Updating the App

When you make changes and want to rebuild:

```bash
# Increment version in app.json first
# Then rebuild
eas build --platform android --profile production
```

### Local Build (Alternative)

If you prefer to build locally instead of using EAS:

```bash
# Install dependencies
npm install

# Build locally (requires Android Studio)
npx expo run:android --variant release
```

Note: Local builds require Android Studio and SDK setup.

## 📱 App Information

- **Package Name**: com.fsmpro.mobile
- **Version**: 1.0.0
- **Version Code**: 1
- **Production API**: https://fsmpro.phishsimulator.com/api

## 🔐 Default Credentials

**Technician Account:**
- Email: mobile.tech@fsm.com
- Password: mobile123

**Admin Dashboard** (for creating more technicians):
- URL: https://fsmpro.phishsimulator.com
- Email: admin@fsm.com
- Password: admin123

## 📝 Notes

- The app automatically detects production vs development mode
- Production builds use `https://fsmpro.phishsimulator.com/api`
- Development builds use local API endpoints
- All builds are APK format for easy distribution

