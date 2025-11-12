import 'package:flutter/foundation.dart';
import '../data/models/work_order.dart';
import '../data/repositories/customer_repository.dart';

/// Provider for customer dashboard state management.
/// Manages customer's work orders and equipment data.
class CustomerProvider extends ChangeNotifier {
  final CustomerRepository _repository;

  CustomerProvider(this._repository);

  // State
  List<WorkOrder> _workOrders = [];
  List<WorkOrder> _workshopJobs = [];
  bool _isLoading = false;
  String? _error;

  // Getters
  List<WorkOrder> get workOrders => _workOrders;
  List<WorkOrder> get workshopJobs => _workshopJobs;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Get active work orders (non-completed)
  List<WorkOrder> get activeWorkOrders {
    return _workOrders
        .where((order) => order.status != WorkOrderStatus.completed)
        .toList();
  }

  /// Fetch customer's work orders
  Future<void> fetchCustomerWorkOrders(String customerId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final result = await _repository.getCustomerWorkOrders(customerId);

    if (result.isSuccess && result.data != null) {
      _workOrders = result.data!;
      _error = null;
    } else {
      _error = result.error ?? 'Failed to fetch work orders';
      _workOrders = [];
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Fetch customer's workshop jobs
  Future<void> fetchCustomerWorkshopJobs(String customerId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final result = await _repository.getCustomerWorkshopJobs(customerId);

    if (result.isSuccess && result.data != null) {
      _workshopJobs = result.data!;
      _error = null;
    } else {
      _error = result.error ?? 'Failed to fetch workshop jobs';
      _workshopJobs = [];
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Fetch all customer data (work orders and workshop jobs)
  Future<void> fetchAllCustomerData(String customerId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    // Fetch both work orders and workshop jobs in parallel
    final results = await Future.wait([
      _repository.getCustomerWorkOrders(customerId),
      _repository.getCustomerWorkshopJobs(customerId),
    ]);

    final workOrdersResult = results[0];
    final workshopJobsResult = results[1];

    if (workOrdersResult.isSuccess && workOrdersResult.data != null) {
      _workOrders = workOrdersResult.data!;
    } else {
      _workOrders = [];
    }

    if (workshopJobsResult.isSuccess && workshopJobsResult.data != null) {
      _workshopJobs = workshopJobsResult.data!;
    } else {
      _workshopJobs = [];
    }

    // Set error only if both failed
    if (!workOrdersResult.isSuccess && !workshopJobsResult.isSuccess) {
      _error = workOrdersResult.error ?? 'Failed to fetch customer data';
    } else {
      _error = null;
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Clear all data
  void clear() {
    _workOrders = [];
    _workshopJobs = [];
    _isLoading = false;
    _error = null;
    notifyListeners();
  }
}
