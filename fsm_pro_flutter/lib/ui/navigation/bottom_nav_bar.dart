import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../data/models/user.dart';

/// Bottom navigation bar with role-based tabs.
/// Displays different navigation options for technicians and customers.
class BottomNavBar extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;
  final UserRole userRole;

  const BottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.userRole,
  });

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: onTap,
      type: BottomNavigationBarType.fixed,
      selectedItemColor: AppColors.primary,
      unselectedItemColor: AppColors.textSecondary,
      selectedFontSize: 12,
      unselectedFontSize: 12,
      items: _getNavigationItems(),
    );
  }

  /// Get navigation items based on user role
  List<BottomNavigationBarItem> _getNavigationItems() {
    switch (userRole) {
      case UserRole.technician:
      case UserRole.admin:
      case UserRole.superAdmin:
      case UserRole.manager:
        return _getTechnicianItems();
      case UserRole.customer:
        return _getCustomerItems();
    }
  }

  /// Get navigation items for technicians
  List<BottomNavigationBarItem> _getTechnicianItems() {
    return const [
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

  /// Get navigation items for customers
  List<BottomNavigationBarItem> _getCustomerItems() {
    return const [
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
