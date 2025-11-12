import 'package:flutter/foundation.dart';
import '../data/models/work_order.dart';
import '../data/repositories/work_order_repository.dart';

/// Provider for work order state management.
/// Manages work order list, filtering, search, and status updates.
class WorkOrderProvider extends ChangeNotifier {
  final WorkOrderRepository _workOrderRepository;

  List<WorkOrder> _workOrders = [];
  WorkOrder? _selectedWorkOrder;
  String _currentFilter = 'all';
  String _searchQuery = '';
  bool _isLoading = false;
  String? _error;

  WorkOrderProvider({required WorkOrderRepository workOrderRepository})
    : _workOrderRepository = workOrderRepository;

  // ==================== Getters ====================

  /// All work orders
  List<WorkOrder> get workOrders => _workOrders;

  /// Selected work order for details view
  WorkOrder? get selectedWorkOrder => _selectedWorkOrder;

  /// Current filter (all, scheduled, inProgress, completed)
  String get currentFilter => _currentFilter;

  /// Current search query
  String get searchQuery => _searchQuery;

  /// Loading state
  bool get isLoading => _isLoading;

  /// Error message
  String? get error => _error;

  /// Filtered work orders based on current filter and search query
  List<WorkOrder> get filteredWorkOrders {
    var filtered = _workOrders;

    // Apply status filter
    if (_currentFilter != 'all') {
      WorkOrderStatus? statusFilter;
      switch (_currentFilter.toLowerCase()) {
        case 'scheduled':
          statusFilter = WorkOrderStatus.scheduled;
          break;
        case 'inprogress':
        case 'in_progress':
          statusFilter = WorkOrderStatus.inProgress;
          break;
        case 'completed':
          statusFilter = WorkOrderStatus.completed;
          break;
        case 'cancelled':
          statusFilter = WorkOrderStatus.cancelled;
          break;
      }

      if (statusFilter != null) {
        filtered = filtered
            .where((order) => order.status == statusFilter)
            .toList();
      }
    }

    // Apply search query (already filtered by repository, but apply again for client-side updates)
    if (_searchQuery.trim().isNotEmpty) {
      final query = _searchQuery.toLowerCase().trim();
      filtered = filtered.where((order) {
        final jobNumber = order.id.toLowerCase();
        final title = order.title.toLowerCase();
        final customerName = (order.customerName ?? '').toLowerCase();

        return jobNumber.contains(query) ||
            title.contains(query) ||
            customerName.contains(query);
      }).toList();
    }

    return filtered;
  }

  // ==================== Public Methods ====================

  /// Fetch work orders from repository
  /// Optionally filter by technician ID or customer ID
  Future<void> fetchWorkOrders({
    String? technicianId,
    String? customerId,
  }) async {
    debugPrint('📋 WorkOrderProvider: Fetching work orders...');
    _setLoading(true);
    _clearError();

    try {
      final result = await _workOrderRepository.getWorkOrders(
        technicianId: technicianId,
        customerId: customerId,
        searchQuery: _searchQuery.isNotEmpty ? _searchQuery : null,
      );

      if (result.isSuccess && result.data != null) {
        _workOrders = result.data!;
        debugPrint(
          '✅ WorkOrderProvider: Loaded ${_workOrders.length} work orders',
        );
        _setLoading(false);
      } else {
        debugPrint('❌ WorkOrderProvider: Failed - ${result.error}');
        _setError(result.error ?? 'Failed to load work orders');
        _setLoading(false);
      }
    } catch (e, stackTrace) {
      debugPrint('❌ WorkOrderProvider: Exception caught');
      debugPrint('   Error: $e');
      debugPrint('   Stack trace: $stackTrace');
      _setError('Failed to load work orders: ${e.toString()}');
      _setLoading(false);
    }
  }

  /// Fetch single work order details by ID
  Future<void> fetchWorkOrderDetails(String id) async {
    _setLoading(true);
    _clearError();

    final result = await _workOrderRepository.getWorkOrder(id);

    if (result.isSuccess && result.data != null) {
      _selectedWorkOrder = result.data;

      // Update the work order in the list if it exists
      final index = _workOrders.indexWhere((order) => order.id == id);
      if (index != -1) {
        _workOrders[index] = result.data!;
      }

      _setLoading(false);
    } else {
      _setError(result.error ?? 'Failed to load work order details');
      _setLoading(false);
    }
  }

  /// Update work order status
  /// Optionally include notes with the status update
  Future<bool> updateWorkOrderStatus(
    String id,
    String status, {
    String? notes,
  }) async {
    _setLoading(true);
    _clearError();

    final result = await _workOrderRepository.updateWorkOrderStatus(
      id,
      status,
      notes: notes,
    );

    if (result.isSuccess && result.data != null) {
      // Update selected work order
      if (_selectedWorkOrder?.id == id) {
        _selectedWorkOrder = result.data;
      }

      // Update work order in the list
      final index = _workOrders.indexWhere((order) => order.id == id);
      if (index != -1) {
        _workOrders[index] = result.data!;
      }

      _setLoading(false);
      return true;
    } else {
      _setError(result.error ?? 'Failed to update work order status');
      _setLoading(false);
      return false;
    }
  }

  /// Set status filter
  /// Valid values: 'all', 'scheduled', 'inProgress', 'completed', 'cancelled'
  void setFilter(String filter) {
    if (_currentFilter != filter) {
      _currentFilter = filter;
      notifyListeners();
    }
  }

  /// Set search query
  /// Triggers filtering of work orders
  void setSearchQuery(String query) {
    if (_searchQuery != query) {
      _searchQuery = query;
      notifyListeners();
    }
  }

  /// Clear selected work order
  void clearSelectedWorkOrder() {
    _selectedWorkOrder = null;
    notifyListeners();
  }

  /// Clear error message
  void clearError() {
    _clearError();
    notifyListeners();
  }

  /// Refresh work orders (convenience method)
  Future<void> refresh({String? technicianId, String? customerId}) async {
    await fetchWorkOrders(technicianId: technicianId, customerId: customerId);
  }

  // ==================== Private Methods ====================

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
  }
}
