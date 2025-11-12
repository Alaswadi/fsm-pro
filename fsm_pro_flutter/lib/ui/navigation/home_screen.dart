import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/models/user.dart';
import '../../providers/auth_provider.dart';
import '../screens/customer/customer_dashboard_screen.dart';
import '../screens/inventory/inventory_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/work_orders/work_orders_screen.dart';
import '../screens/workshop/workshop_queue_screen.dart';
import 'bottom_nav_bar.dart';

/// Home screen that hosts the bottom navigation and manages tab navigation.
/// Displays different screens based on the selected tab and user role.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final currentUser = authProvider.currentUser;

    // If no user, show error (shouldn't happen due to route guards)
    if (currentUser == null) {
      return const Scaffold(
        body: Center(child: Text('No user found. Please log in.')),
      );
    }

    return Scaffold(
      body: _getScreen(currentUser.role, _currentIndex),
      bottomNavigationBar: BottomNavBar(
        currentIndex: _currentIndex,
        onTap: _onTabTapped,
        userRole: currentUser.role,
      ),
    );
  }

  /// Handle tab selection
  void _onTabTapped(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  /// Get the appropriate screen based on user role and selected tab
  Widget _getScreen(UserRole role, int index) {
    switch (role) {
      case UserRole.technician:
      case UserRole.admin:
      case UserRole.superAdmin:
      case UserRole.manager:
        return _getTechnicianScreen(index);
      case UserRole.customer:
        return _getCustomerScreen(index);
    }
  }

  /// Get screen for technician role based on tab index
  /// Tabs: 0=Work Orders, 1=Inventory, 2=Workshop, 3=Profile
  Widget _getTechnicianScreen(int index) {
    switch (index) {
      case 0:
        return const WorkOrdersScreen();
      case 1:
        return const InventoryScreen();
      case 2:
        return const WorkshopQueueScreen();
      case 3:
        return const ProfileScreen();
      default:
        return const WorkOrdersScreen();
    }
  }

  /// Get screen for customer role based on tab index
  /// Tabs: 0=Dashboard, 1=Work Orders, 2=Profile
  Widget _getCustomerScreen(int index) {
    switch (index) {
      case 0:
        return const CustomerDashboardScreen();
      case 1:
        return const WorkOrdersScreen();
      case 2:
        return const ProfileScreen();
      default:
        return const CustomerDashboardScreen();
    }
  }
}
