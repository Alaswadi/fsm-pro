import 'package:flutter/foundation.dart';
import '../data/models/equipment_status.dart';
import '../data/models/work_order.dart';
import '../data/repositories/workshop_repository.dart';

/// Provider for workshop operations state management.
/// Manages workshop queue, job claiming, and equipment status tracking.
class WorkshopProvider extends ChangeNotifier {
  final WorkshopRepository _workshopRepository;

  List<WorkOrder> _workshopQueue = [];
  EquipmentStatus? _currentEquipmentStatus;
  List<EquipmentStatusHistory> _statusHistory = [];
  bool _isLoading = false;
  String? _error;

  WorkshopProvider({required WorkshopRepository workshopRepository})
    : _workshopRepository = workshopRepository;

  // ==================== Getters ====================

  /// Workshop queue jobs
  List<WorkOrder> get workshopQueue => _workshopQueue;

  /// Current equipment status being viewed/edited
  EquipmentStatus? get currentEquipmentStatus => _currentEquipmentStatus;

  /// Equipment status history
  List<EquipmentStatusHistory> get statusHistory => _statusHistory;

  /// Loading state
  bool get isLoading => _isLoading;

  /// Error message
  String? get error => _error;

  // ==================== Public Methods ====================

  /// Fetch workshop queue from repository
  /// Returns list of workshop jobs with various statuses
  Future<void> fetchWorkshopQueue() async {
    debugPrint('🔧 WorkshopProvider: Fetching workshop queue...');
    _setLoading(true);
    _clearError();

    final result = await _workshopRepository.getWorkshopQueue();

    if (result.isSuccess && result.data != null) {
      _workshopQueue = result.data!;
      debugPrint('✅ WorkshopProvider: Loaded ${_workshopQueue.length} jobs');
      _setLoading(false);
    } else {
      debugPrint('❌ WorkshopProvider: Failed - ${result.error}');
      _setError(result.error ?? 'Failed to load workshop queue');
      _setLoading(false);
    }
  }

  /// Claim a workshop job
  /// Assigns the job to the current technician
  Future<bool> claimJob(String jobId) async {
    _setLoading(true);
    _clearError();

    final result = await _workshopRepository.claimWorkshopJob(jobId);

    if (result.isSuccess && result.data != null) {
      // Update the job in the queue
      final index = _workshopQueue.indexWhere((job) => job.id == jobId);
      if (index != -1) {
        _workshopQueue[index] = result.data!;
      }

      _setLoading(false);
      return true;
    } else {
      _setError(result.error ?? 'Failed to claim job');
      _setLoading(false);
      return false;
    }
  }

  /// Fetch equipment status for a specific job
  Future<void> fetchEquipmentStatus(String jobId) async {
    _setLoading(true);
    _clearError();

    final result = await _workshopRepository.getEquipmentStatus(jobId);

    if (result.isSuccess && result.data != null) {
      _currentEquipmentStatus = result.data;

      // If status includes history, update it
      if (result.data!.history != null) {
        _statusHistory = result.data!.history!;
      }

      _setLoading(false);
    } else {
      _setError(result.error ?? 'Failed to load equipment status');
      _setLoading(false);
    }
  }

  /// Update equipment status
  /// Optionally include notes with the status update
  Future<bool> updateEquipmentStatus(
    String jobId,
    String status, {
    String? notes,
  }) async {
    _setLoading(true);
    _clearError();

    final result = await _workshopRepository.updateEquipmentStatus(
      jobId,
      status,
      notes: notes,
    );

    if (result.isSuccess && result.data != null) {
      _currentEquipmentStatus = result.data;

      // Refresh status history after update
      await fetchEquipmentStatusHistory(jobId);

      _setLoading(false);
      return true;
    } else {
      _setError(result.error ?? 'Failed to update equipment status');
      _setLoading(false);
      return false;
    }
  }

  /// Fetch equipment status history for a specific job
  Future<void> fetchEquipmentStatusHistory(String jobId) async {
    // Don't show loading for history fetch (it's a background operation)
    final result = await _workshopRepository.getEquipmentStatusHistory(jobId);

    if (result.isSuccess && result.data != null) {
      _statusHistory = result.data!;
      notifyListeners();
    }
    // Silently fail for history - it's not critical
  }

  /// Get next possible status transitions based on current status
  /// Returns list of valid next statuses
  List<EquipmentRepairStatus> getNextStatuses(
    EquipmentRepairStatus currentStatus,
  ) {
    switch (currentStatus) {
      case EquipmentRepairStatus.pendingIntake:
        return [
          EquipmentRepairStatus.inTransit,
          EquipmentRepairStatus.received,
        ];
      case EquipmentRepairStatus.inTransit:
        return [EquipmentRepairStatus.received];
      case EquipmentRepairStatus.received:
        return [EquipmentRepairStatus.inRepair];
      case EquipmentRepairStatus.inRepair:
        return [EquipmentRepairStatus.repairCompleted];
      case EquipmentRepairStatus.repairCompleted:
        return [
          EquipmentRepairStatus.readyForPickup,
          EquipmentRepairStatus.outForDelivery,
        ];
      case EquipmentRepairStatus.readyForPickup:
        return [EquipmentRepairStatus.returned];
      case EquipmentRepairStatus.outForDelivery:
        return [EquipmentRepairStatus.returned];
      case EquipmentRepairStatus.returned:
        return []; // Final status
    }
  }

  /// Get display text for equipment status
  String getStatusDisplayText(EquipmentRepairStatus status) {
    switch (status) {
      case EquipmentRepairStatus.pendingIntake:
        return 'Pending Intake';
      case EquipmentRepairStatus.inTransit:
        return 'In Transit';
      case EquipmentRepairStatus.received:
        return 'Received';
      case EquipmentRepairStatus.inRepair:
        return 'In Repair';
      case EquipmentRepairStatus.repairCompleted:
        return 'Repair Completed';
      case EquipmentRepairStatus.readyForPickup:
        return 'Ready for Pickup';
      case EquipmentRepairStatus.outForDelivery:
        return 'Out for Delivery';
      case EquipmentRepairStatus.returned:
        return 'Returned';
    }
  }

  /// Clear current equipment status
  void clearEquipmentStatus() {
    _currentEquipmentStatus = null;
    _statusHistory = [];
    notifyListeners();
  }

  /// Clear error message
  void clearError() {
    _clearError();
    notifyListeners();
  }

  /// Refresh workshop queue (convenience method)
  Future<void> refresh() async {
    await fetchWorkshopQueue();
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
