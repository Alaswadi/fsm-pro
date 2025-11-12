import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/models/user.dart';
import '../../../data/models/work_order.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/work_order_provider.dart';
import '../../widgets/common/error_view.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/work_order/work_order_card.dart';
import 'work_order_details_screen.dart';

/// Screen displaying list of work orders with filtering and search
class WorkOrdersScreen extends StatefulWidget {
  const WorkOrdersScreen({super.key});

  @override
  State<WorkOrdersScreen> createState() => _WorkOrdersScreenState();
}

class _WorkOrdersScreenState extends State<WorkOrdersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  bool _isInitialized = false;

  final List<String> _filterTabs = [
    'all',
    'scheduled',
    'inProgress',
    'completed',
  ];
  final Map<String, String> _filterLabels = {
    'all': 'All',
    'scheduled': 'Scheduled',
    'inProgress': 'In Progress',
    'completed': 'Completed',
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _filterTabs.length, vsync: this);
    _tabController.addListener(_onTabChanged);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInitialized) {
      _isInitialized = true;
      // Schedule the load after the current frame to avoid setState during build
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadWorkOrders();
      });
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) {
      final filter = _filterTabs[_tabController.index];
      context.read<WorkOrderProvider>().setFilter(filter);
    }
  }

  Future<void> _loadWorkOrders() async {
    final authProvider = context.read<AuthProvider>();
    final workOrderProvider = context.read<WorkOrderProvider>();

    // Load work orders filtered by technician if user is a technician
    if (authProvider.currentUser?.role == UserRole.technician) {
      await workOrderProvider.fetchWorkOrders(
        technicianId: authProvider.currentUser?.technicianId,
      );
    } else {
      await workOrderProvider.fetchWorkOrders();
    }
  }

  Future<void> _onRefresh() async {
    await _loadWorkOrders();
  }

  void _onSearchChanged(String query) {
    context.read<WorkOrderProvider>().setSearchQuery(query);
  }

  void _navigateToWorkOrderDetails(WorkOrder workOrder) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => WorkOrderDetailsScreen(workOrderId: workOrder.id),
      ),
    );
  }

  void _navigateToWorkshopQueue() {
    // TODO: Navigate to workshop queue screen (will be implemented in task 12)
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Workshop queue screen coming soon'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final isTechnician = authProvider.currentUser?.role == UserRole.technician;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Work Orders'),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(110),
          child: Column(
            children: [
              // Search field
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: _onSearchChanged,
                  decoration: InputDecoration(
                    hintText: 'Search by job number, title, or customer...',
                    prefixIcon: const Icon(
                      Icons.search,
                      color: AppColors.textSecondary,
                    ),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(
                              Icons.clear,
                              color: AppColors.textSecondary,
                            ),
                            onPressed: () {
                              _searchController.clear();
                              _onSearchChanged('');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: AppColors.inputBackground,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                ),
              ),
              // Tab bar
              TabBar(
                controller: _tabController,
                labelColor: AppColors.primary,
                unselectedLabelColor: AppColors.textSecondary,
                indicatorColor: AppColors.primary,
                indicatorWeight: 3,
                labelStyle: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
                unselectedLabelStyle: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
                tabs: _filterTabs
                    .map((filter) => Tab(text: _filterLabels[filter]))
                    .toList(),
              ),
            ],
          ),
        ),
      ),
      body: Consumer<WorkOrderProvider>(
        builder: (context, workOrderProvider, child) {
          if (workOrderProvider.isLoading &&
              workOrderProvider.workOrders.isEmpty) {
            return const LoadingIndicator(message: 'Loading work orders...');
          }

          if (workOrderProvider.error != null &&
              workOrderProvider.workOrders.isEmpty) {
            return ErrorView(
              message: workOrderProvider.error!,
              errorType: ErrorType.network,
              onRetry: _loadWorkOrders,
            );
          }

          final filteredWorkOrders = workOrderProvider.filteredWorkOrders;

          if (filteredWorkOrders.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            onRefresh: _onRefresh,
            color: AppColors.primary,
            child: ListView.builder(
              padding: const EdgeInsets.only(top: 8, bottom: 80),
              itemCount: filteredWorkOrders.length,
              itemBuilder: (context, index) {
                final workOrder = filteredWorkOrders[index];
                return WorkOrderCard(
                  workOrder: workOrder,
                  onTap: () => _navigateToWorkOrderDetails(workOrder),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: isTechnician
          ? FloatingActionButton.extended(
              onPressed: _navigateToWorkshopQueue,
              backgroundColor: AppColors.primary,
              icon: const Icon(Icons.home_repair_service, color: Colors.white),
              label: const Text(
                'Workshop Queue',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildEmptyState() {
    final workOrderProvider = context.watch<WorkOrderProvider>();
    final hasSearch = workOrderProvider.searchQuery.isNotEmpty;
    final hasFilter = workOrderProvider.currentFilter != 'all';

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              hasSearch || hasFilter ? Icons.search_off : Icons.work_outline,
              size: 64,
              color: AppColors.textSecondary.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              hasSearch || hasFilter
                  ? 'No work orders found'
                  : 'No work orders yet',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              hasSearch || hasFilter
                  ? 'Try adjusting your search or filters'
                  : 'Work orders will appear here when assigned',
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            if (hasSearch || hasFilter) ...[
              const SizedBox(height: 24),
              TextButton.icon(
                onPressed: () {
                  _searchController.clear();
                  _onSearchChanged('');
                  _tabController.animateTo(0);
                  context.read<WorkOrderProvider>().setFilter('all');
                },
                icon: const Icon(Icons.clear_all),
                label: const Text('Clear filters'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
