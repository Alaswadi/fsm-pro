# App Icons and Splash Screen Assets

This directory contains the icon and splash screen assets for the FSM Pro mobile application.

## Required Files

To generate app icons and splash screens, you need to provide the following files:

### App Icon
- **app_icon.png** - Main app icon (1024x1024 px recommended)
  - This will be used to generate all required icon sizes for iOS and Android
  - Should be a square image with your app logo
  - Background should be transparent or solid color

- **app_icon_foreground.png** - Foreground layer for Android adaptive icon (1024x1024 px)
  - Used for Android 8.0+ adaptive icons
  - Should contain only the foreground elements (logo/icon)
  - Must have transparent background
  - Safe zone: Keep important content within center 66% (684x684 px)

### Splash Screen
- **splash_logo.png** - Logo displayed on splash screen (512x512 px recommended)
  - Centered logo shown while app is loading
  - Should have transparent background
  - Will be displayed on white background

## Generating Icons and Splash Screens

After adding the required image files to this directory, run:

```bash
# Generate app icons
flutter pub run flutter_launcher_icons

# Generate splash screens
flutter pub run flutter_native_splash:create
```

## Current Configuration

The app is configured with:
- **App Name**: FSM Pro
- **Bundle ID (iOS)**: com.fsmpro.mobile
- **Package Name (Android)**: com.fsmpro.mobile
- **Primary Color**: #2196F3 (Blue)
- **Splash Background**: #FFFFFF (White)

## Design Guidelines

### App Icon Design
- Use the FSM Pro brand colors (primary blue: #2196F3)
- Keep design simple and recognizable at small sizes
- Avoid text in the icon (use logo/symbol only)
- Ensure good contrast for visibility

### Splash Screen Design
- Logo should be clear and centered
- Avoid complex graphics that slow loading
- Match brand identity

## Placeholder Status

⚠️ **Note**: Currently using placeholder/default icons. Replace with actual branded assets before production release.

To replace:
1. Add your designed icon files to this directory
2. Run the generation commands above
3. Test on both iOS and Android devices
4. Verify icons appear correctly in all contexts (home screen, settings, notifications)
