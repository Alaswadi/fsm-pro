# Placeholder Icon Instructions

## Quick Setup for Development

Since we don't have the final branded icons yet, you can use one of these approaches:

### Option 1: Use Default Flutter Icons (Current)
The app will use the default Flutter launcher icons until custom icons are provided.

### Option 2: Generate Simple Placeholder Icons
You can create simple placeholder icons using online tools:

1. **Canva** (https://www.canva.com)
   - Create a 1024x1024 px design
   - Add "FSM" text with blue background (#2196F3)
   - Export as PNG

2. **Figma** (https://www.figma.com)
   - Create a 1024x1024 frame
   - Design your icon
   - Export as PNG

3. **Online Icon Generators**
   - https://icon.kitchen/
   - https://www.appicon.co/
   - Upload a simple logo or use text

### Option 3: Use ImageMagick (Command Line)
If you have ImageMagick installed:

```bash
# Create a simple blue square with "FSM" text
convert -size 1024x1024 xc:"#2196F3" \
  -gravity center \
  -pointsize 400 \
  -fill white \
  -annotate +0+0 "FSM" \
  app_icon.png
```

### Option 4: Professional Design
For production, work with a designer to create:
- Professional app icon following iOS and Android guidelines
- Adaptive icon layers for Android
- Splash screen logo
- Brand-consistent design

## After Creating Icons

1. Place the icon files in this directory:
   - `app_icon.png` (1024x1024)
   - `app_icon_foreground.png` (1024x1024, transparent background)
   - `splash_logo.png` (512x512, transparent background)

2. Run generation commands:
   ```bash
   flutter pub get
   flutter pub run flutter_launcher_icons
   flutter pub run flutter_native_splash:create
   ```

3. Test on devices:
   ```bash
   flutter run
   ```

## Resources

- [iOS App Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Adaptive Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [Material Design Icons](https://m3.material.io/styles/icons/overview)
