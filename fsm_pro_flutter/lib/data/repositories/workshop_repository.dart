import '../../core/errors/exceptions.dart';
import '../../core/utils/result.dart';
import '../models/equipment_status.dart';
import '../models/work_order.dart';
import '../services/api_service.dart';

/// Repository for workshop operations.
/// Wraps ApiService workshop methods with Result pattern and
/// provides user-friendly error messages.
class WorkshopRepository {
  final ApiService _apiService;

  WorkshopRepository(this._apiService);

  /// Get workshop queue
  /// Returns Result with List<WorkOrder> on success or error message on failure
  Future<Result<List<WorkOrder>>> getWorkshopQueue() async {
    try {
      final jobs = await _apiService.getWorkshopQueue();
      return Result.success(jobs);
    } on AuthException {
      return Result.error('Session expired. Please login again.');
    } on NetworkException catch (e) {
      return Result.error(e.message);
    } on AppException catch (e) {
      return Result.error(e.message);
    } catch (e) {
      return Result.error('Failed to load workshop queue. Please try again.');
    }
  }

  /// Claim a workshop job
  /// Returns Result with WorkOrder on success or error message on failure
  Future<Result<WorkOrder>> claimWorkshopJob(String jobId) async {
    try {
      if (jobId.isEmpty) {
        return Result.error('Job ID is required');
      }

      final job = await _apiService.claimWorkshopJob(jobId);
      return Result.success(job);
    } on AuthException {
      return Result.error('Session expired. Please login again.');
    } on NetworkException catch (e) {
      return Result.error(e.message);
    } on AppException catch (e) {
      return Result.error(e.message);
    } catch (e) {
      return Result.error('Failed to claim job. Please try again.');
    }
  }

  /// Get equipment status for a job
  /// Returns Result with EquipmentStatus on success or error message on failure
  Future<Result<EquipmentStatus>> getEquipmentStatus(String jobId) async {
    try {
      if (jobId.isEmpty) {
        return Result.error('Job ID is required');
      }

      final status = await _apiService.getEquipmentStatus(jobId);
      return Result.success(status);
    } on AuthException {
      return Result.error('Session expired. Please login again.');
    } on NetworkException catch (e) {
      return Result.error(e.message);
    } on AppException catch (e) {
      return Result.error(e.message);
    } catch (e) {
      return Result.error('Failed to load equipment status. Please try again.');
    }
  }

  /// Update equipment status
  /// Returns Result with updated EquipmentStatus on success or error message on failure
  Future<Result<EquipmentStatus>> updateEquipmentStatus(
    String jobId,
    String status, {
    String? notes,
  }) async {
    try {
      if (jobId.isEmpty) {
        return Result.error('Job ID is required');
      }

      if (status.isEmpty) {
        return Result.error('Status is required');
      }

      final equipmentStatus = await _apiService.updateEquipmentStatus(
        jobId,
        status,
        notes: notes,
      );
      return Result.success(equipmentStatus);
    } on AuthException {
      return Result.error('Session expired. Please login again.');
    } on NetworkException catch (e) {
      return Result.error(e.message);
    } on AppException catch (e) {
      return Result.error(e.message);
    } catch (e) {
      return Result.error(
        'Failed to update equipment status. Please try again.',
      );
    }
  }

  /// Get equipment status history
  /// Returns Result with List<EquipmentStatusHistory> on success or error message on failure
  Future<Result<List<EquipmentStatusHistory>>> getEquipmentStatusHistory(
    String jobId,
  ) async {
    try {
      if (jobId.isEmpty) {
        return Result.error('Job ID is required');
      }

      final history = await _apiService.getEquipmentStatusHistory(jobId);
      return Result.success(history);
    } on AuthException {
      return Result.error('Session expired. Please login again.');
    } on NetworkException catch (e) {
      return Result.error(e.message);
    } on AppException catch (e) {
      return Result.error(e.message);
    } catch (e) {
      return Result.error(
        'Failed to load equipment status history. Please try again.',
      );
    }
  }

  /// Get customer's workshop jobs
  /// Returns Result with List<WorkOrder> on success or error message on failure
  Future<Result<List<WorkOrder>>> getCustomerWorkshopJobs(
    String customerId,
  ) async {
    try {
      if (customerId.isEmpty) {
        return Result.error('Customer ID is required');
      }

      final jobs = await _apiService.getCustomerWorkshopJobs(customerId);
      return Result.success(jobs);
    } on AuthException {
      return Result.error('Session expired. Please login again.');
    } on NetworkException catch (e) {
      return Result.error(e.message);
    } on AppException catch (e) {
      return Result.error(e.message);
    } catch (e) {
      return Result.error('Failed to load customer jobs. Please try again.');
    }
  }
}
