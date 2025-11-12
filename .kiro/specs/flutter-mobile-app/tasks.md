# Implementation Plan

- [x] 1. Set up Flutter project structure and dependencies





  - Create new Flutter project with proper naming and organization
  - Add all required dependencies to pubspec.yaml (provider, dio, shared_preferences, flutter_secure_storage, hive, intl, cached_network_image, go_router)
  - Configure project structure with core/, data/, providers/, and ui/ directories
  - Set up app theme with Material Design 3 and custom colors matching the design
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Implement core infrastructure and utilities





  - [x] 2.1 Create constants files for API endpoints, colors, and strings


    - Define API_CONSTANTS with base URL and all endpoint paths
    - Define APP_COLORS with all color values from design (status, priority, stock levels)
    - Define APP_STRINGS for reusable text strings
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1, 11.1, 12.1_


  - [x] 2.2 Create theme configuration

    - Implement AppTheme class with lightTheme configuration
    - Configure Material Design 3 color scheme
    - Set up AppBar, Card, and InputDecoration themes
    - _Requirements: All UI requirements_

  - [x] 2.3 Create utility classes


    - Implement date formatter utility for displaying dates consistently
    - Implement input validators for email and password
    - Create Result class for error handling pattern
    - Create custom exception classes (AppException, NetworkException, AuthException)
    - _Requirements: 1.3, 10.1, 10.2, 10.3_

- [x] 3. Implement data models






  - [x] 3.1 Create User model

    - Define User class with all fields including technician-specific fields
    - Implement fromJson and toJson methods
    - Define UserRole enum
    - _Requirements: 1.1, 6.1, 9.1_


  - [x] 3.2 Create WorkOrder model

    - Define WorkOrder class with all fields including workshop-specific fields
    - Implement fromJson and toJson methods
    - Define WorkOrderStatus, WorkOrderPriority, and LocationType enums
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 4.1, 7.1, 8.1, 9.2_

  - [x] 3.3 Create InventoryItem model


    - Define InventoryItem class with all fields
    - Implement fromJson and toJson methods
    - Add stockLevel getter method with logic for stock level calculation
    - Define StockLevel enum
    - _Requirements: 5.1, 5.4, 5.5, 5.6_

  - [x] 3.4 Create EquipmentStatus and related models


    - Define EquipmentStatus class with all timestamp fields
    - Define EquipmentStatusHistory class
    - Implement fromJson and toJson methods
    - Define EquipmentRepairStatus enum
    - _Requirements: 8.1, 8.2, 8.5_



  - [x] 3.5 Create Customer and Equipment models

    - Define Customer class with contact information fields
    - Define Equipment class with equipment details
    - Implement fromJson and toJson methods for both
    - _Requirements: 3.4, 9.2_

  - [x] 3.6 Create API response wrapper models


    - Define ApiResponse<T> class for wrapping API responses
    - Define AuthResponse class for login response
    - Define WorkOrderListResponse class for paginated work orders
    - _Requirements: 1.1, 2.2, 10.1_

- [x] 4. Implement storage service





  - Create StorageService class using SharedPreferences and FlutterSecureStorage
  - Implement methods for storing and retrieving auth token securely
  - Implement methods for storing and retrieving user data
  - Implement clearAuth method to remove all auth data
  - _Requirements: 11.1, 11.2, 11.4, 11.5_

- [x] 5. Implement API service and interceptors





  - [x] 5.1 Create base ApiService class


    - Initialize Dio with base URL, timeout, and headers
    - Set up request interceptor to add auth token from storage
    - Set up response interceptor to handle 401 errors and clear auth
    - Implement error handling helper methods
    - _Requirements: 10.1, 10.2, 10.3, 11.2_

  - [x] 5.2 Implement authentication API methods

    - Implement login method (POST /api/auth/login)
    - Implement logout method (POST /api/auth/logout)
    - Implement getProfile method (GET /api/auth/profile)
    - Store token and user data on successful login
    - _Requirements: 1.1, 1.2, 6.1_

  - [x] 5.3 Implement work order API methods

    - Implement getWorkOrders method with query parameters (GET /api/jobs)
    - Implement getWorkOrder method (GET /api/jobs/:id)
    - Implement updateWorkOrderStatus method (PATCH /api/jobs/:id/status)
    - _Requirements: 2.2, 3.2, 4.2_

  - [x] 5.4 Implement inventory API methods

    - Implement getInventory method (GET /api/inventory)
    - _Requirements: 5.2_

  - [x] 5.5 Implement workshop API methods

    - Implement getWorkshopQueue method (GET /api/workshop/queue)
    - Implement claimWorkshopJob method (POST /api/workshop/jobs/:id/claim)
    - Implement getEquipmentStatus method (GET /api/workshop/status/:jobId)
    - Implement updateEquipmentStatus method (PUT /api/workshop/status/:jobId)
    - Implement getEquipmentStatusHistory method (GET /api/workshop/status/:jobId/history)
    - _Requirements: 7.2, 7.5, 8.2, 8.4, 8.5_

  - [x] 5.6 Implement customer API methods

    - Implement getCustomerWorkshopJobs method (GET /api/workshop/customer/:customerId/jobs)
    - _Requirements: 9.2, 9.4_

- [x] 6. Implement repository layer





  - [x] 6.1 Create AuthRepository


    - Wrap ApiService auth methods with Result pattern
    - Handle errors and convert to user-friendly messages
    - _Requirements: 1.1, 1.3, 10.1_

  - [x] 6.2 Create WorkOrderRepository


    - Wrap ApiService work order methods with Result pattern
    - Implement client-side search filtering logic
    - Handle errors and convert to user-friendly messages
    - _Requirements: 2.2, 2.5, 3.2, 4.2, 10.1_

  - [x] 6.3 Create InventoryRepository


    - Wrap ApiService inventory methods with Result pattern
    - Implement client-side search filtering logic
    - Handle errors and convert to user-friendly messages
    - _Requirements: 5.2, 5.3, 10.1_

  - [x] 6.4 Create WorkshopRepository


    - Wrap ApiService workshop methods with Result pattern
    - Handle errors and convert to user-friendly messages
    - _Requirements: 7.2, 7.5, 8.2, 8.4, 8.5, 10.1_

- [x] 7. Implement state management providers





  - [x] 7.1 Create AuthProvider


    - Implement login method that calls AuthRepository
    - Implement logout method that clears storage and state
    - Implement checkAuthStatus method that checks for stored token
    - Add isAuthenticated getter
    - Add loading and error state management
    - Notify listeners on state changes
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 11.2, 11.3, 11.4_

  - [x] 7.2 Create WorkOrderProvider


    - Implement fetchWorkOrders method that calls WorkOrderRepository
    - Implement fetchWorkOrderDetails method for single work order
    - Implement updateWorkOrderStatus method
    - Implement setFilter method for status filtering
    - Implement setSearchQuery method for search
    - Add filteredWorkOrders getter that applies filters and search
    - Add loading and error state management
    - Notify listeners on state changes
    - _Requirements: 2.2, 2.4, 2.5, 2.6, 3.2, 4.2, 4.3, 4.4_

  - [x] 7.3 Create InventoryProvider


    - Implement fetchInventory method that calls InventoryRepository
    - Implement setSearchQuery method for search
    - Add filteredItems getter that applies search filter
    - Implement getStockLevelColor method for UI color coding
    - Add loading and error state management
    - Notify listeners on state changes
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 7.4 Create WorkshopProvider


    - Implement fetchWorkshopQueue method
    - Implement claimJob method
    - Implement fetchEquipmentStatus method
    - Implement updateEquipmentStatus method
    - Implement fetchEquipmentStatusHistory method
    - Add loading and error state management
    - Notify listeners on state changes
    - _Requirements: 7.2, 7.5, 8.2, 8.4, 8.5_

- [x] 8. Implement common UI widgets






  - [x] 8.1 Create CustomButton widget

    - Implement reusable button with loading state
    - Support primary and secondary button styles
    - Handle disabled state
    - _Requirements: 1.1, 4.1_

  - [x] 8.2 Create CustomTextField widget


    - Implement reusable text field with consistent styling
    - Support password field with show/hide toggle
    - Support validation error display
    - _Requirements: 1.1_

  - [x] 8.3 Create LoadingIndicator widget


    - Implement centered circular progress indicator
    - Support overlay loading for full screen
    - _Requirements: 1.5, 10.5_

  - [x] 8.4 Create ErrorView widget


    - Implement error display with icon and message
    - Include retry button
    - Support different error types (network, auth, generic)
    - _Requirements: 10.1, 10.2, 10.4_

  - [x] 8.5 Create StatusBadge widget


    - Implement colored badge for work order status
    - Map status to colors from AppColors
    - _Requirements: 2.3, 7.3_

  - [x] 8.6 Create WorkOrderCard widget


    - Implement card layout matching design with job number, title, customer, date, status badge
    - Add left border color based on priority
    - Handle tap to navigate to details
    - _Requirements: 2.3_

  - [x] 8.7 Create InventoryItemCard widget


    - Implement card layout with part name, SKU, price, stock level bar
    - Add stock level color coding
    - Display warning icon for low stock
    - _Requirements: 5.1, 5.4, 5.5, 5.6_

- [-] 9. Implement authentication screens


  - [x] 9.1 Create LoginScreen



    - Build UI with logo, email field, password field, login button, forgot password link
    - Implement form validation
    - Connect to AuthProvider for login
    - Handle loading state during login
    - Display error messages from provider
    - Navigate to home on successful login
    - Add system status indicator at bottom
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 9.2 Create ForgotPasswordScreen
    - Build UI for password reset flow
    - Implement email input and submit
    - Connect to API for password reset initiation
    - _Requirements: 1.4_

- [x] 10. Implement work orders screens






  - [x] 10.1 Create WorkOrdersScreen

    - Build UI with tab bar for status filters (All, Scheduled, In Progress, Completed)
    - Add search field at top
    - Implement list view with WorkOrderCard widgets
    - Connect to WorkOrderProvider for data
    - Handle loading and error states
    - Implement pull-to-refresh
    - Add floating action button for workshop queue (technicians only)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_


  - [x] 10.2 Create WorkOrderDetailsScreen

    - Build UI with job header, customer info card, equipment info card, job details section
    - Connect to WorkOrderProvider for selected work order data
    - Display notes section if notes exist
    - Add action buttons (Start, Complete, Cancel) based on current status
    - Handle loading and error states
    - Add equipment tracking section for workshop jobs
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


  - [x] 10.3 Implement work order status update functionality

    - Add status update button handlers
    - Show confirmation dialog for status changes
    - Show notes input dialog for completion
    - Call WorkOrderProvider updateWorkOrderStatus method
    - Display success/error messages via SnackBar
    - Refresh work order details on success
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 11. Implement inventory screen





  - Create InventoryScreen with search field and add button
  - Implement list view with InventoryItemCard widgets
  - Connect to InventoryProvider for data
  - Handle loading and error states
  - Implement pull-to-refresh
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 12. Implement workshop screens






  - [x] 12.1 Create WorkshopQueueScreen

    - Build UI with list of workshop jobs
    - Display job cards with job number, equipment type, customer, priority, status
    - Add "Claim Job" button for unassigned jobs
    - Connect to WorkshopProvider for queue data
    - Handle loading and error states
    - Implement pull-to-refresh
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


  - [x] 12.2 Create EquipmentTrackingComponent

    - Build UI with current status card and timestamp
    - Display status transition buttons based on current status
    - Show status history timeline
    - Add notes input for status changes
    - Connect to WorkshopProvider for equipment status
    - Handle status update actions
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13. Implement profile screen





  - Create ProfileScreen with avatar, name, role display
  - Add availability toggle connected to API
  - Display today's summary cards (jobs completed, hours logged)
  - Show contact information section with icons
  - Show skills & certifications section with icons
  - Add settings button (placeholder for now)
  - Add logout button that calls AuthProvider logout
  - Connect to AuthProvider for user data
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 14. Implement customer dashboard





  - Create CustomerDashboardScreen with welcome header
  - Display active work orders section
  - Display equipment list section
  - Connect to customer-specific API endpoints
  - Handle loading and error states
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 15. Implement navigation and routing






  - [x] 15.1 Create AppRouter with named routes

    - Define all route paths as constants
    - Implement generateRoute method with route guards
    - Add authentication check for protected routes
    - _Requirements: 11.3, 11.4_


  - [x] 15.2 Create BottomNavBar widget

    - Implement bottom navigation with role-based tabs
    - Technician tabs: Work Orders, Inventory, Workshop, Profile
    - Customer tabs: Dashboard, Work Orders, Profile
    - Handle tab selection and navigation
    - Highlight active tab
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 15.3 Create HomeScreen with bottom navigation


    - Implement screen that hosts bottom navigation
    - Manage navigation state
    - Display appropriate screen based on selected tab
    - _Requirements: 12.1, 12.5_

- [x] 16. Implement app initialization and main entry point





  - Create main.dart with app initialization
  - Set up MultiProvider with all providers
  - Initialize storage service
  - Check authentication status on app start
  - Navigate to login or home based on auth status
  - Wrap app with MaterialApp and theme
  - _Requirements: 11.2, 11.3, 11.4_

- [x] 17. Configure app assets and metadata




  - Add app icon for iOS and Android
  - Configure app name and bundle identifiers
  - Set up splash screen
  - Configure permissions in AndroidManifest.xml and Info.plist
  - _Requirements: All requirements depend on proper app configuration_

- [x] 18. Build and test on physical devices





  - Build debug APK for Android testing
  - Test on physical Android device
  - Verify all features work correctly
  - Test network error scenarios
  - Test authentication flow end-to-end
  - _Requirements: All requirements_
