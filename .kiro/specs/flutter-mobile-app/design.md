# Flutter Mobile App Design Document

## Overview

The Flutter mobile app will be a cross-platform (iOS and Android) application that provides field service technicians and customers with mobile access to the FSM Pro platform. The app will integrate with the existing Node.js/Express backend API and follow Material Design 3 principles with a clean, modern UI inspired by the provided screen designs.

### Key Design Goals

- **Native Performance**: Leverage Flutter's compiled nature for smooth, native-like performance
- **Offline-First Capability**: Design for graceful degradation when network is unavailable
- **Consistent UI**: Follow Material Design 3 with custom theming matching the brand
- **Role-Based Experience**: Provide tailored interfaces for technicians vs customers
- **API Compatibility**: Work seamlessly with existing backend without modifications

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│         Flutter Mobile App              │
│  ┌───────────────────────────────────┐  │
│  │     Presentation Layer            │  │
│  │  (Screens, Widgets, State)        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │     Business Logic Layer          │  │
│  │  (Providers, Services, Models)    │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │     Data Layer                    │  │
│  │  (API Client, Local Storage)      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    │ HTTPS/REST
                    ▼
┌─────────────────────────────────────────┐
│      Backend API (Existing)             │
│   https://fsmpro.phishsimulator.com/api│
└─────────────────────────────────────────┘
```

### Architecture Patterns

1. **State Management**: Provider pattern for state management (simple, Flutter-recommended)
2. **Navigation**: Named routes with route guards for authentication
3. **API Integration**: Dio HTTP client with interceptors for auth and error handling
4. **Local Storage**: SharedPreferences for simple key-value storage, Hive for structured data caching
5. **Dependency Injection**: Provider for service location and dependency injection

### Project Structure

```
lib/
├── main.dart
├── app.dart
├── core/
│   ├── constants/
│   │   ├── api_constants.dart
│   │   ├── app_colors.dart
│   │   └── app_strings.dart
│   ├── theme/
│   │   └── app_theme.dart
│   ├── utils/
│   │   ├── date_formatter.dart
│   │   └── validators.dart
│   └── errors/
│       └── exceptions.dart
├── data/
│   ├── models/
│   │   ├── user.dart
│   │   ├── work_order.dart
│   │   ├── inventory_item.dart
│   │   ├── equipment.dart
│   │   └── customer.dart
│   ├── repositories/
│   │   ├── auth_repository.dart
│   │   ├── work_order_repository.dart
│   │   ├── inventory_repository.dart
│   │   └── workshop_repository.dart
│   └── services/
│       ├── api_service.dart
│       ├── storage_service.dart
│       └── auth_service.dart
├── providers/
│   ├── auth_provider.dart
│   ├── work_order_provider.dart
│   ├── inventory_provider.dart
│   └── workshop_provider.dart
└── ui/
    ├── screens/
    │   ├── auth/
    │   │   ├── login_screen.dart
    │   │   └── forgot_password_screen.dart
    │   ├── work_orders/
    │   │   ├── work_orders_screen.dart
    │   │   └── work_order_details_screen.dart
    │   ├── inventory/
    │   │   └── inventory_screen.dart
    │   ├── workshop/
    │   │   ├── workshop_queue_screen.dart
    │   │   └── equipment_tracking_screen.dart
    │   ├── profile/
    │   │   └── profile_screen.dart
    │   └── customer/
    │       └── customer_dashboard_screen.dart
    ├── widgets/
    │   ├── common/
    │   │   ├── custom_button.dart
    │   │   ├── custom_text_field.dart
    │   │   ├── loading_indicator.dart
    │   │   └── error_view.dart
    │   ├── work_order/
    │   │   ├── work_order_card.dart
    │   │   └── status_badge.dart
    │   └── inventory/
    │       └── inventory_item_card.dart
    └── navigation/
        ├── app_router.dart
        └── bottom_nav_bar.dart
```

## Components and Interfaces

### 1. Authentication Flow

#### Login Screen
- **Design**: Clean, centered layout with app logo, email/password fields, login button, and forgot password link
- **Components**:
  - Email text field with validation
  - Password text field with show/hide toggle
  - Login button with loading state
  - "Forgot Password?" link
  - System status indicator at bottom
- **State Management**: AuthProvider handles login state
- **API Integration**: POST /api/auth/login

#### Auth Provider
```dart
class AuthProvider extends ChangeNotifier {
  User? _currentUser;
  String? _token;
  bool _isLoading = false;
  String? _error;
  
  Future<bool> login(String email, String password);
  Future<void> logout();
  Future<bool> checkAuthStatus();
  bool get isAuthenticated;
}
```

### 2. Work Orders Module

#### Work Orders Screen
- **Design**: List view with filter tabs, search bar, and work order cards
- **Components**:
  - Tab bar: All, Scheduled, In Progress, Completed
  - Search field with icon
  - Work order cards showing:
    - Job number with calendar icon
    - Title
    - Customer name
    - Date and time
    - Status badge (color-coded)
    - Left border color indicating priority
  - Floating action button for workshop queue (technicians only)
- **State Management**: WorkOrderProvider manages list and filters
- **API Integration**: GET /api/jobs with query parameters

#### Work Order Details Screen
- **Design**: Scrollable detail view with sections
- **Components**:
  - Header with job number and status
  - Customer information card
  - Equipment information card (if applicable)
  - Job details section
  - Notes section
  - Action buttons (Start, Complete, Cancel)
  - Equipment tracking section (for workshop jobs)
- **State Management**: WorkOrderProvider manages selected work order
- **API Integration**: 
  - GET /api/jobs/:id
  - PATCH /api/jobs/:id/status
  - GET /api/workshop/status/:jobId (for workshop jobs)

#### Work Order Provider
```dart
class WorkOrderProvider extends ChangeNotifier {
  List<WorkOrder> _workOrders = [];
  WorkOrder? _selectedWorkOrder;
  String _currentFilter = 'all';
  String _searchQuery = '';
  bool _isLoading = false;
  
  Future<void> fetchWorkOrders();
  Future<void> fetchWorkOrderDetails(String id);
  Future<void> updateWorkOrderStatus(String id, String status, String? notes);
  void setFilter(String filter);
  void setSearchQuery(String query);
  List<WorkOrder> get filteredWorkOrders;
}
```

### 3. Inventory Module

#### Inventory Screen
- **Design**: List view with search and inventory item cards
- **Components**:
  - Search field with icon
  - Add button (top right)
  - Inventory item cards showing:
    - Part name
    - SKU
    - Price (right aligned)
    - Stock level progress bar (color-coded)
    - Stock count with warning icon if low
- **State Management**: InventoryProvider manages inventory list
- **API Integration**: GET /api/inventory

#### Inventory Provider
```dart
class InventoryProvider extends ChangeNotifier {
  List<InventoryItem> _items = [];
  String _searchQuery = '';
  bool _isLoading = false;
  
  Future<void> fetchInventory();
  void setSearchQuery(String query);
  List<InventoryItem> get filteredItems;
  Color getStockLevelColor(InventoryItem item);
}
```

### 4. Workshop Module

#### Workshop Queue Screen
- **Design**: List view of workshop jobs with claim functionality
- **Components**:
  - Filter/sort options
  - Workshop job cards showing:
    - Job number
    - Equipment type and details
    - Customer name
    - Priority badge
    - Equipment status badge
    - Claim button (if unassigned)
- **State Management**: WorkshopProvider manages queue
- **API Integration**: 
  - GET /api/workshop/queue
  - POST /api/workshop/jobs/:id/claim

#### Equipment Tracking Component
- **Design**: Status timeline with current status highlighted
- **Components**:
  - Current status card with timestamp
  - Status transition buttons
  - Status history timeline
  - Notes input for status changes
- **State Management**: WorkshopProvider manages equipment status
- **API Integration**:
  - GET /api/workshop/status/:jobId
  - PUT /api/workshop/status/:jobId
  - GET /api/workshop/status/:jobId/history

### 5. Profile Module

#### Profile Screen
- **Design**: Scrollable profile view with sections
- **Components**:
  - Avatar (circular, centered)
  - Name and role
  - Availability toggle
  - Today's summary cards (jobs completed, hours logged)
  - Contact information section with icons
  - Skills & certifications section with icons
  - Settings button
  - Logout button (red)
- **State Management**: AuthProvider manages user data
- **API Integration**: 
  - GET /api/auth/profile
  - PATCH /api/technicians/:id/availability

### 6. Customer Dashboard

#### Customer Dashboard Screen
- **Design**: Overview screen for customers
- **Components**:
  - Welcome header
  - Active work orders section
  - Equipment list section
  - Quick actions
- **State Management**: Separate CustomerProvider
- **API Integration**:
  - GET /api/workshop/customer/:customerId/jobs
  - GET /api/equipment/customer-equipment

## Data Models

### User Model
```dart
class User {
  final String id;
  final String email;
  final String fullName;
  final String? phone;
  final UserRole role;
  final bool isActive;
  final String? avatarUrl;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // For technicians
  final String? technicianId;
  final List<String>? skills;
  final List<String>? certifications;
  final bool? isAvailable;
  
  factory User.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
}

enum UserRole { superAdmin, admin, manager, technician, customer }
```

### Work Order Model
```dart
class WorkOrder {
  final String id;
  final String customerId;
  final String? equipmentId;
  final String? technicianId;
  final String title;
  final String description;
  final WorkOrderPriority priority;
  final WorkOrderStatus status;
  final DateTime scheduledDate;
  final DateTime? dueDate;
  final int? estimatedDuration;
  final int? actualDuration;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // Workshop fields
  final LocationType? locationType;
  final DateTime? estimatedCompletionDate;
  final double? pickupDeliveryFee;
  
  // Joined fields
  final String? customerName;
  final String? equipmentInfo;
  final String? technicianName;
  final EquipmentStatus? equipmentStatus;
  
  factory WorkOrder.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
}

enum WorkOrderStatus { scheduled, inProgress, completed, cancelled }
enum WorkOrderPriority { low, medium, high, urgent }
enum LocationType { onSite, workshop }
```

### Inventory Item Model
```dart
class InventoryItem {
  final String id;
  final String companyId;
  final String partNumber;
  final String name;
  final String? description;
  final String? category;
  final double unitPrice;
  final double? costPrice;
  final int currentStock;
  final int minStockLevel;
  final int maxStockLevel;
  final String status;
  final String? imageUrl;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  factory InventoryItem.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
  
  StockLevel get stockLevel {
    if (currentStock == 0) return StockLevel.outOfStock;
    if (currentStock <= minStockLevel) return StockLevel.critical;
    if (currentStock <= minStockLevel * 1.5) return StockLevel.low;
    return StockLevel.adequate;
  }
}

enum StockLevel { adequate, low, critical, outOfStock }
```

### Equipment Status Model
```dart
class EquipmentStatus {
  final String id;
  final String jobId;
  final String companyId;
  final EquipmentRepairStatus currentStatus;
  final DateTime? pendingIntakeAt;
  final DateTime? inTransitAt;
  final DateTime? receivedAt;
  final DateTime? inRepairAt;
  final DateTime? repairCompletedAt;
  final DateTime? readyForPickupAt;
  final DateTime? outForDeliveryAt;
  final DateTime? returnedAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<EquipmentStatusHistory>? history;
  
  factory EquipmentStatus.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
}

enum EquipmentRepairStatus {
  pendingIntake,
  inTransit,
  received,
  inRepair,
  repairCompleted,
  readyForPickup,
  outForDelivery,
  returned
}
```

## API Integration

### API Service

```dart
class ApiService {
  final Dio _dio;
  final StorageService _storage;
  
  static const String baseUrl = 'https://fsmpro.phishsimulator.com/api';
  static const Duration timeout = Duration(seconds: 30);
  
  ApiService(this._storage) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: timeout,
      receiveTimeout: timeout,
      headers: {'Content-Type': 'application/json'},
    ));
    
    _setupInterceptors();
  }
  
  void _setupInterceptors() {
    // Request interceptor - add auth token
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token expired, clear storage and redirect to login
          await _storage.clearAuth();
          // Emit event to navigate to login
        }
        return handler.next(error);
      },
    ));
  }
  
  // Auth endpoints
  Future<ApiResponse<AuthResponse>> login(String email, String password);
  Future<ApiResponse<void>> logout();
  Future<ApiResponse<User>> getProfile();
  
  // Work order endpoints
  Future<ApiResponse<WorkOrderListResponse>> getWorkOrders({
    String? status,
    String? technicianId,
    String? customerId,
    int? page,
    int? limit,
  });
  Future<ApiResponse<WorkOrder>> getWorkOrder(String id);
  Future<ApiResponse<WorkOrder>> updateWorkOrderStatus(
    String id,
    String status,
    String? notes,
  );
  
  // Inventory endpoints
  Future<ApiResponse<List<InventoryItem>>> getInventory();
  
  // Workshop endpoints
  Future<ApiResponse<List<WorkOrder>>> getWorkshopQueue();
  Future<ApiResponse<WorkOrder>> claimWorkshopJob(String jobId);
  Future<ApiResponse<EquipmentStatus>> getEquipmentStatus(String jobId);
  Future<ApiResponse<EquipmentStatus>> updateEquipmentStatus(
    String jobId,
    String status,
    String? notes,
  );
  Future<ApiResponse<List<EquipmentStatusHistory>>> getEquipmentStatusHistory(
    String jobId,
  );
}
```

### Repository Pattern

Repositories will wrap the API service and provide a clean interface for the business logic layer:

```dart
class WorkOrderRepository {
  final ApiService _apiService;
  
  WorkOrderRepository(this._apiService);
  
  Future<Result<List<WorkOrder>>> getWorkOrders({
    String? status,
    String? searchQuery,
  }) async {
    try {
      final response = await _apiService.getWorkOrders(status: status);
      if (response.success && response.data != null) {
        var orders = response.data!.jobs;
        if (searchQuery != null && searchQuery.isNotEmpty) {
          orders = orders.where((order) =>
            order.title.toLowerCase().contains(searchQuery.toLowerCase()) ||
            order.customerName?.toLowerCase().contains(searchQuery.toLowerCase()) ?? false
          ).toList();
        }
        return Result.success(orders);
      }
      return Result.error(response.error ?? 'Failed to fetch work orders');
    } catch (e) {
      return Result.error('Network error: ${e.toString()}');
    }
  }
}
```

## Error Handling

### Error Types

1. **Network Errors**: Connection timeout, no internet
2. **API Errors**: 4xx/5xx responses
3. **Authentication Errors**: 401 unauthorized
4. **Validation Errors**: Invalid input data

### Error Handling Strategy

```dart
class Result<T> {
  final T? data;
  final String? error;
  final bool isSuccess;
  
  Result.success(this.data) : isSuccess = true, error = null;
  Result.error(this.error) : isSuccess = false, data = null;
}

class AppException implements Exception {
  final String message;
  final String? code;
  
  AppException(this.message, [this.code]);
}

class NetworkException extends AppException {
  NetworkException(String message) : super(message, 'NETWORK_ERROR');
}

class AuthException extends AppException {
  AuthException(String message) : super(message, 'AUTH_ERROR');
}
```

### Error UI Components

- **ErrorView Widget**: Reusable error display with retry button
- **SnackBar**: For non-critical errors and success messages
- **Dialog**: For critical errors requiring user acknowledgment

## UI/UX Design

### Theme Configuration

```dart
class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.light,
      ),
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: false,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
      ),
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: AppColors.border, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.inputBackground,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }
}

class AppColors {
  static const Color primary = Color(0xFF2196F3);
  static const Color textPrimary = Color(0xFF1A1A1A);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color inputBackground = Color(0xFFF3F4F6);
  static const Color border = Color(0xFFE5E7EB);
  
  // Status colors
  static const Color statusScheduled = Color(0xFF3B82F6);
  static const Color statusInProgress = Color(0xFFF59E0B);
  static const Color statusCompleted = Color(0xFF10B981);
  static const Color statusCancelled = Color(0xFFEF4444);
  
  // Priority colors
  static const Color priorityLow = Color(0xFF9CA3AF);
  static const Color priorityMedium = Color(0xFFF59E0B);
  static const Color priorityHigh = Color(0xFFF97316);
  static const Color priorityUrgent = Color(0xFFEF4444);
  
  // Stock level colors
  static const Color stockAdequate = Color(0xFF3B82F6);
  static const Color stockLow = Color(0xFFF59E0B);
  static const Color stockCritical = Color(0xFFEF4444);
  static const Color stockOut = Color(0xFF9CA3AF);
}
```

### Navigation Structure

```dart
class AppRouter {
  static const String login = '/login';
  static const String home = '/home';
  static const String workOrders = '/work-orders';
  static const String workOrderDetails = '/work-orders/:id';
  static const String inventory = '/inventory';
  static const String workshopQueue = '/workshop-queue';
  static const String profile = '/profile';
  static const String customerDashboard = '/customer-dashboard';
  
  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case login:
        return MaterialPageRoute(builder: (_) => LoginScreen());
      case home:
        return MaterialPageRoute(builder: (_) => HomeScreen());
      // ... other routes
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(child: Text('Route not found')),
          ),
        );
    }
  }
}
```

### Bottom Navigation

```dart
class BottomNavBar extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;
  final UserRole userRole;
  
  List<BottomNavigationBarItem> _getTechnicianItems() {
    return [
      BottomNavigationBarItem(
        icon: Icon(Icons.work_outline),
        activeIcon: Icon(Icons.work),
        label: 'Work Orders',
      ),
      BottomNavigationBarItem(
        icon: Icon(Icons.inventory_outlined),
        activeIcon: Icon(Icons.inventory),
        label: 'Inventory',
      ),
      BottomNavigationBarItem(
        icon: Icon(Icons.build_outlined),
        activeIcon: Icon(Icons.build),
        label: 'Workshop',
      ),
      BottomNavigationBarItem(
        icon: Icon(Icons.person_outline),
        activeIcon: Icon(Icons.person),
        label: 'Profile',
      ),
    ];
  }
  
  List<BottomNavigationBarItem> _getCustomerItems() {
    return [
      BottomNavigationBarItem(
        icon: Icon(Icons.dashboard_outlined),
        activeIcon: Icon(Icons.dashboard),
        label: 'Dashboard',
      ),
      BottomNavigationBarItem(
        icon: Icon(Icons.work_outline),
        activeIcon: Icon(Icons.work),
        label: 'Work Orders',
      ),
      BottomNavigationBarItem(
        icon: Icon(Icons.person_outline),
        activeIcon: Icon(Icons.person),
        label: 'Profile',
      ),
    ];
  }
}
```

## Testing Strategy

### Unit Tests
- Test all data models (fromJson, toJson)
- Test all business logic in providers
- Test utility functions and validators
- Test repository methods with mocked API service

### Widget Tests
- Test individual widgets in isolation
- Test widget interactions and state changes
- Test form validation
- Test error states and loading states

### Integration Tests
- Test complete user flows (login, view work orders, update status)
- Test navigation between screens
- Test API integration with mock server
- Test offline behavior

### Test Structure
```
test/
├── unit/
│   ├── models/
│   ├── providers/
│   ├── repositories/
│   └── utils/
├── widget/
│   ├── screens/
│   └── widgets/
└── integration/
    └── flows/
```

## Performance Considerations

1. **Lazy Loading**: Implement pagination for large lists
2. **Image Caching**: Use cached_network_image for avatar and equipment images
3. **State Optimization**: Use const constructors where possible
4. **List Optimization**: Use ListView.builder for efficient list rendering
5. **API Caching**: Cache API responses with expiration times
6. **Debouncing**: Debounce search input to reduce API calls

## Security Considerations

1. **Token Storage**: Use flutter_secure_storage for sensitive data
2. **HTTPS Only**: All API calls over HTTPS
3. **Token Expiration**: Handle 401 responses and refresh tokens
4. **Input Validation**: Validate all user inputs before API calls
5. **Certificate Pinning**: Consider implementing for production

## Offline Support (Future Enhancement)

While not in the initial scope, the architecture supports future offline capabilities:

1. **Local Database**: Use Hive or SQLite for local data storage
2. **Sync Queue**: Queue API calls when offline
3. **Conflict Resolution**: Handle data conflicts when coming back online
4. **Offline Indicators**: Show clear UI indicators when offline

## Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  provider: ^6.1.1
  
  # HTTP & API
  dio: ^5.4.0
  
  # Local Storage
  shared_preferences: ^2.2.2
  flutter_secure_storage: ^9.0.0
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  
  # UI & Utilities
  intl: ^0.18.1
  cached_network_image: ^3.3.0
  flutter_svg: ^2.0.9
  
  # Navigation
  go_router: ^13.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  mockito: ^5.4.4
  build_runner: ^2.4.7
  hive_generator: ^2.0.1
```

## Deployment

### Build Configuration

- **iOS**: Configure signing, bundle ID, and app icons
- **Android**: Configure signing keys, package name, and app icons
- **Environment Variables**: Use --dart-define for API URLs per environment

### Release Checklist

1. Update version numbers in pubspec.yaml
2. Test on physical devices (iOS and Android)
3. Run all tests
4. Build release APK/IPA
5. Test release builds
6. Submit to app stores
