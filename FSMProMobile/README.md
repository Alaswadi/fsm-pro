# FSM Pro Mobile App

A React Native mobile application for Field Service Management built with Expo.

## Features

- **Authentication**: Secure login with JWT tokens
- **Work Orders**: View, filter, and manage work orders
- **Schedule**: Calendar view of scheduled jobs
- **Inventory**: Track equipment and inventory items
- **Profile**: User profile with status management
- **File Upload**: Camera integration for job photos
- **Push Notifications**: Real-time notifications for job updates

## Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **Expo Router** for navigation
- **AsyncStorage** for local data persistence
- **Axios** for API communication
- **Expo Notifications** for push notifications
- **Expo Image Picker** for camera/gallery access

## Get Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on Android**:
   - Press `a` in the terminal to open on Android emulator
   - Or scan the QR code with Expo Go app on your Android device

## Configuration

### API Configuration

The app connects to your FSM backend API. Make sure the backend is running:

```bash
cd ../  # Go back to fsm-pro root
docker-compose up
```

API should be available at: `http://localhost:3001/api`

### Demo Technician Credentials

**Ready-to-use technician account for testing:**

- **Email**: mobile.tech@fsm.com
- **Password**: mobile123
- **Name**: Mobile Technician

### Creating Additional Technician Accounts

To create more technician accounts:

1. **Access Admin Dashboard**: Go to `http://localhost:3000`
2. **Login as Admin**: Use admin@fsm.com / admin123
3. **Create Technician**:
   - Go to Technicians section
   - Click "Add New Technician"
   - Fill in user details with role "technician"
   - Set a password (remember it for mobile login)
4. **Use Mobile App**: Login with the technician credentials you just created

**Note**: This mobile app is designed for technicians only. Admin users should use the web dashboard.

## Building for Production

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Build APK for Android**:
   ```bash
   eas build --platform android --profile preview
   ```

## Key Features

- **Work Orders**: List, filter, and manage work orders with status updates
- **File Upload**: Camera integration for job photos
- **Push Notifications**: Real-time job notifications
- **Offline Support**: Basic offline functionality

## Troubleshooting

- **Metro bundler fails**: `npx expo start --clear`
- **API connection issues**: Verify backend is running at `http://localhost:3001`
- **Android build fails**: Check Android SDK installation
