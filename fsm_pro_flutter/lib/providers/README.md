# Providers

This directory contains state management providers using the Provider pattern for the FSM Pro Flutter app.

## Overview

All providers extend `ChangeNotifier` and follow a consistent pattern:
- Private repositories/services for data access
- Public getters for state access
- Public methods for state mutations
- Loading and error state management
- Automatic listener notification on state changes

## Providers

### AuthProvider

Manages authentication state and operations.

**Dependencies:**
- `AuthRepository` - for authentication API calls
- `StorageService` - for persisting auth data

**Key Features:**
- Login with email/password
- Logout and clear auth data
- Check authentication status on app start
- Persist user data between sessions
- Automatic token validation

**Usage:**
```dart
final authProvider = Provider.of<AuthProvider>(context);

// Login
await authProvider.login(email, password);

// Check if authenticated
if (authProvider.isAuthenticated) {
  // User is logged in
}

// Logout
await authProvider.logout();
```

### WorkOrderProvider

Manages work order list, filtering, and status updates.

**Dependencies:**
- `WorkOrderRepository` - for work order API calls

**Key Features:**
- Fetch work orders with optional filters
- Fetch single work order details
- Update work order status
- Filter by status (all, scheduled, inProgress, completed)
- Search by job number, title, or customer name
- Client-side filtering and search

**Usage:**
```dart
final workOrderProvider = Provider.of<WorkOrderProvider>(context);

// Fetch work orders
await workOrderProvider.fetchWorkOrders(technicianId: userId);

// Get filtered work orders
final orders = workOrderProvider.filteredWorkOrders;

// Set filter
workOrderProvider.setFilter('inProgress');

// Set search query
workOrderProvider.setSearchQuery('repair');

// Update status
await workOrderProvider.updateWorkOrderStatus(
  orderId,
  'completed',
  notes: 'Job completed successfully',
);
```

### InventoryProvider

Manages inventory list and search.

**Dependencies:**
- `InventoryRepository` - for inventory API calls

**Key Features:**
- Fetch inventory items
- Search by part number, name, or description
- Get stock level colors for UI display
- Calculate stock level percentages
- Determine if items need warning indicators

**Usage:**
```dart
final inventoryProvider = Provider.of<InventoryProvider>(context);

// Fetch inventory
await inventoryProvider.fetchInventory();

// Get filtered items
final items = inventoryProvider.filteredItems;

// Set search query
inventoryProvider.setSearchQuery('filter');

// Get stock level color
final color = inventoryProvider.getStockLevelColor(item);

// Get stock level percentage for progress bar
final percentage = inventoryProvider.getStockLevelPercentage(item);
```

### WorkshopProvider

Manages workshop queue and equipment status tracking.

**Dependencies:**
- `WorkshopRepository` - for workshop API calls

**Key Features:**
- Fetch workshop queue
- Claim workshop jobs
- Fetch equipment status
- Update equipment status with notes
- Fetch equipment status history
- Get next possible status transitions
- Get display text for statuses

**Usage:**
```dart
final workshopProvider = Provider.of<WorkshopProvider>(context);

// Fetch workshop queue
await workshopProvider.fetchWorkshopQueue();

// Claim a job
await workshopProvider.claimJob(jobId);

// Fetch equipment status
await workshopProvider.fetchEquipmentStatus(jobId);

// Update equipment status
await workshopProvider.updateEquipmentStatus(
  jobId,
  'in_repair',
  notes: 'Started repair work',
);

// Get next possible statuses
final nextStatuses = workshopProvider.getNextStatuses(
  currentStatus,
);
```

## Common Patterns

### Loading State

All providers have an `isLoading` getter:

```dart
if (provider.isLoading) {
  return CircularProgressIndicator();
}
```

### Error Handling

All providers have an `error` getter:

```dart
if (provider.error != null) {
  return Text(provider.error!);
}
```

### Refresh Pattern

All providers support refresh operations:

```dart
// Pull to refresh
await provider.refresh();
```

## Integration with App

Providers should be set up in the app's main widget tree using `MultiProvider`:

```dart
MultiProvider(
  providers: [
    ChangeNotifierProvider(
      create: (context) => AuthProvider(
        authRepository: authRepository,
        storageService: storageService,
      ),
    ),
    ChangeNotifierProvider(
      create: (context) => WorkOrderProvider(
        workOrderRepository: workOrderRepository,
      ),
    ),
    ChangeNotifierProvider(
      create: (context) => InventoryProvider(
        inventoryRepository: inventoryRepository,
      ),
    ),
    ChangeNotifierProvider(
      create: (context) => WorkshopProvider(
        workshopRepository: workshopRepository,
      ),
    ),
  ],
  child: MyApp(),
)
```

## Testing

Each provider can be tested independently by mocking its dependencies:

```dart
test('login success updates user state', () async {
  final mockRepo = MockAuthRepository();
  final mockStorage = MockStorageService();
  
  when(mockRepo.login(any, any))
    .thenAnswer((_) async => Result.success(testUser));
  
  final provider = AuthProvider(
    authRepository: mockRepo,
    storageService: mockStorage,
  );
  
  await provider.login('test@example.com', 'password');
  
  expect(provider.isAuthenticated, true);
  expect(provider.currentUser, testUser);
});
```
