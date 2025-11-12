import 'package:flutter/material.dart';
import '../../data/models/user.dart';
import '../../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/customer/customer_dashboard_screen.dart';
import '../screens/inventory/inventory_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/work_orders/work_order_details_screen.dart';
import '../screens/work_orders/work_orders_screen.dart';
import '../screens/workshop/workshop_queue_screen.dart';
import 'home_screen.dart';

/// Application router with named routes and route guards.
/// Handles navigation and authentication checks for protected routes.
class AppRouter {
  // ==================== Route Constants ====================

  static const String login = '/login';
  static const String home = '/home';
  static const String workOrders = '/work-orders';
  static const String workOrderDetails = '/work-orders/details';
  static const String inventory = '/inventory';
  static const String workshopQueue = '/workshop-queue';
  static const String profile = '/profile';
  static const String customerDashboard = '/customer-dashboard';

  // ==================== Route Generation ====================

  /// Generate routes with authentication guards
  static Route<dynamic> generateRoute(
    RouteSettings settings,
    AuthProvider authProvider,
  ) {
    // Check if user is authenticated
    final isAuthenticated = authProvider.isAuthenticated;
    final currentUser = authProvider.currentUser;

    // Handle route based on authentication status
    switch (settings.name) {
      case login:
        // If already authenticated, redirect to home
        if (isAuthenticated) {
          return MaterialPageRoute(
            builder: (_) => const HomeScreen(),
            settings: settings,
          );
        }
        return MaterialPageRoute(
          builder: (_) => const LoginScreen(),
          settings: settings,
        );

      case home:
        // Protected route - require authentication
        if (!isAuthenticated) {
          return _redirectToLogin(settings);
        }
        return MaterialPageRoute(
          builder: (_) => const HomeScreen(),
          settings: settings,
        );

      case workOrders:
        // Protected route - require authentication
        if (!isAuthenticated) {
          return _redirectToLogin(settings);
        }
        return MaterialPageRoute(
          builder: (_) => const WorkOrdersScreen(),
          settings: settings,
        );

      case workOrderDetails:
        // Protected route - require authentication
        if (!isAuthenticated) {
          return _redirectToLogin(settings);
        }
        // Extract work order ID from arguments
        final args = settings.arguments as Map<String, dynamic>?;
        final workOrderId = args?['workOrderId'] as String?;

        if (workOrderId == null) {
          return _errorRoute('Work order ID is required', settings);
        }

        return MaterialPageRoute(
          builder: (_) => WorkOrderDetailsScreen(workOrderId: workOrderId),
          settings: settings,
        );

      case inventory:
        // Protected route - require authentication and technician role
        if (!isAuthenticated) {
          return _redirectToLogin(settings);
        }
        if (!_isTechnician(currentUser)) {
          return _unauthorizedRoute(settings);
        }
        return MaterialPageRoute(
          builder: (_) => const InventoryScreen(),
          settings: settings,
        );

      case workshopQueue:
        // Protected route - require authentication and technician role
        if (!isAuthenticated) {
          return _redirectToLogin(settings);
        }
        if (!_isTechnician(currentUser)) {
          return _unauthorizedRoute(settings);
        }
        return MaterialPageRoute(
          builder: (_) => const WorkshopQueueScreen(),
          settings: settings,
        );

      case profile:
        // Protected route - require authentication
        if (!isAuthenticated) {
          return _redirectToLogin(settings);
        }
        return MaterialPageRoute(
          builder: (_) => const ProfileScreen(),
          settings: settings,
        );

      case customerDashboard:
        // Protected route - require authentication and customer role
        if (!isAuthenticated) {
          return _redirectToLogin(settings);
        }
        if (!_isCustomer(currentUser)) {
          return _unauthorizedRoute(settings);
        }
        return MaterialPageRoute(
          builder: (_) => const CustomerDashboardScreen(),
          settings: settings,
        );

      default:
        return _notFoundRoute(settings);
    }
  }

  // ==================== Helper Methods ====================

  /// Check if user is a technician
  static bool _isTechnician(User? user) {
    if (user == null) return false;
    return user.role == UserRole.technician ||
        user.role == UserRole.admin ||
        user.role == UserRole.superAdmin ||
        user.role == UserRole.manager;
  }

  /// Check if user is a customer
  static bool _isCustomer(User? user) {
    if (user == null) return false;
    return user.role == UserRole.customer;
  }

  /// Redirect to login screen
  static Route<dynamic> _redirectToLogin(RouteSettings settings) {
    return MaterialPageRoute(
      builder: (_) => const LoginScreen(),
      settings: RouteSettings(
        name: login,
        arguments: {'redirectFrom': settings.name},
      ),
    );
  }

  /// Show unauthorized error screen
  static Route<dynamic> _unauthorizedRoute(RouteSettings settings) {
    return MaterialPageRoute(
      builder: (context) => Scaffold(
        appBar: AppBar(title: const Text('Unauthorized')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock_outline, size: 64, color: Colors.grey),
              const SizedBox(height: 16),
              const Text(
                'Unauthorized Access',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'You do not have permission to access this page.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pushReplacementNamed(home);
                },
                child: const Text('Go to Home'),
              ),
            ],
          ),
        ),
      ),
      settings: settings,
    );
  }

  /// Show error screen
  static Route<dynamic> _errorRoute(String message, RouteSettings settings) {
    return MaterialPageRoute(
      builder: (context) => Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pop();
                },
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      ),
      settings: settings,
    );
  }

  /// Show 404 not found screen
  static Route<dynamic> _notFoundRoute(RouteSettings settings) {
    return MaterialPageRoute(
      builder: (context) => Scaffold(
        appBar: AppBar(title: const Text('Page Not Found')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.search_off, size: 64, color: Colors.grey),
              const SizedBox(height: 16),
              const Text(
                '404 - Page Not Found',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Route: ${settings.name}',
                style: const TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pushReplacementNamed(home);
                },
                child: const Text('Go to Home'),
              ),
            ],
          ),
        ),
      ),
      settings: settings,
    );
  }
}
