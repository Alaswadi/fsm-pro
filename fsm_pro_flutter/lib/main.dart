import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'core/constants/api_constants.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/customer_repository.dart';
import 'data/repositories/inventory_repository.dart';
import 'data/repositories/work_order_repository.dart';
import 'data/repositories/workshop_repository.dart';
import 'data/services/api_service.dart';
import 'data/services/storage_service.dart';
import 'providers/auth_provider.dart';
import 'providers/customer_provider.dart';
import 'providers/inventory_provider.dart';
import 'providers/work_order_provider.dart';
import 'providers/workshop_provider.dart';

/// Main entry point for the FSM Pro Flutter application.
/// Initializes services, sets up providers, and starts the app.
void main() async {
  // Ensure Flutter bindings are initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Log API configuration
  debugPrint('');
  debugPrint('🚀 FSM Pro Mobile App Starting...');
  ApiConstants.logConfiguration();
  debugPrint('');

  // Initialize storage service
  final storageService = await StorageService.create();

  // Initialize API service with storage
  final apiService = ApiService(storageService);

  // Initialize repositories
  final authRepository = AuthRepository(apiService);
  final workOrderRepository = WorkOrderRepository(apiService);
  final inventoryRepository = InventoryRepository(apiService);
  final workshopRepository = WorkshopRepository(apiService);
  final customerRepository = CustomerRepository(apiService);

  // Run the app with providers
  runApp(
    MultiProvider(
      providers: [
        // Storage service provider
        Provider<StorageService>.value(value: storageService),

        // API service provider
        Provider<ApiService>.value(value: apiService),

        // Repository providers
        Provider<AuthRepository>.value(value: authRepository),
        Provider<WorkOrderRepository>.value(value: workOrderRepository),
        Provider<InventoryRepository>.value(value: inventoryRepository),
        Provider<WorkshopRepository>.value(value: workshopRepository),
        Provider<CustomerRepository>.value(value: customerRepository),

        // State management providers
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider(
            authRepository: authRepository,
            storageService: storageService,
          ),
        ),
        ChangeNotifierProxyProvider<AuthProvider, WorkOrderProvider>(
          create: (_) =>
              WorkOrderProvider(workOrderRepository: workOrderRepository),
          update: (_, auth, previous) =>
              previous ??
              WorkOrderProvider(workOrderRepository: workOrderRepository),
        ),
        ChangeNotifierProxyProvider<AuthProvider, InventoryProvider>(
          create: (_) =>
              InventoryProvider(inventoryRepository: inventoryRepository),
          update: (_, auth, previous) =>
              previous ??
              InventoryProvider(inventoryRepository: inventoryRepository),
        ),
        ChangeNotifierProxyProvider<AuthProvider, WorkshopProvider>(
          create: (_) =>
              WorkshopProvider(workshopRepository: workshopRepository),
          update: (_, auth, previous) =>
              previous ??
              WorkshopProvider(workshopRepository: workshopRepository),
        ),
        ChangeNotifierProxyProvider<AuthProvider, CustomerProvider>(
          create: (_) => CustomerProvider(customerRepository),
          update: (_, auth, previous) =>
              previous ?? CustomerProvider(customerRepository),
        ),
      ],
      child: const FSMProApp(),
    ),
  );
}
