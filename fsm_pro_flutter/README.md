# FSM Pro Flutter Mobile App

A cross-platform mobile application for Field Service Management built with Flutter.

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── app.dart                  # Root app widget
├── core/                     # Core utilities and configurations
│   ├── constants/           # App constants (API, colors, strings)
│   ├── theme/              # App theme configuration
│   ├── utils/              # Utility functions
│   └── errors/             # Custom exceptions
├── data/                    # Data layer
│   ├── models/             # Data models
│   ├── repositories/       # Repository pattern implementations
│   └── services/           # API and storage services
├── providers/              # State management (Provider pattern)
└── ui/                     # Presentation layer
    ├── screens/           # App screens
    ├── widgets/           # Reusable widgets
    └── navigation/        # Navigation configuration
```

## Dependencies

- **provider**: State management
- **dio**: HTTP client for API calls
- **shared_preferences**: Simple key-value storage
- **flutter_secure_storage**: Secure storage for sensitive data
- **hive**: Local database
- **intl**: Internationalization and date formatting
- **cached_network_image**: Image caching
- **go_router**: Navigation and routing

## Getting Started

### Prerequisites

- Flutter SDK 3.35.7 or higher
- Dart 3.9.2 or higher

### Installation

1. Install dependencies:
```bash
flutter pub get
```

2. Run the app:
```bash
flutter run
```

### Development

- Run tests:
```bash
flutter test
```

- Analyze code:
```bash
flutter analyze
```

- Format code:
```bash
flutter format .
```

## API Configuration

The app connects to the FSM Pro backend API at:
```
https://fsmpro.phishsimulator.com/api
```

API endpoints are configured in `lib/core/constants/api_constants.dart`.

## Theme

The app uses Material Design 3 with custom colors defined in:
- `lib/core/constants/app_colors.dart`
- `lib/core/theme/app_theme.dart`

## Next Steps

This is the initial project setup. The following features will be implemented in subsequent tasks:

1. Core infrastructure and utilities
2. Data models
3. Storage service
4. API service and repositories
5. State management providers
6. UI widgets and screens
7. Navigation and routing
8. Authentication flow
9. Work orders management
10. Inventory management
11. Workshop operations
12. Profile management
13. Customer dashboard

## License

Proprietary - FSM Pro
