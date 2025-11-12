import '../../core/errors/exceptions.dart';
import '../../core/utils/result.dart';
import '../models/work_order.dart';
import '../services/api_service.dart';

/// Repository for customer-specific data operations.
/// Wraps API service calls with Result pattern for error handling.
class CustomerRepository {
  final ApiService _apiService;

  CustomerRepository(this._apiService);

  /// Get customer's workshop jobs
  Future<Result<List<WorkOrder>>> getCustomerWorkshopJobs(
    String customerId,
  ) async {
    try {
      final jobs = await _apiService.getCustomerWorkshopJobs(customerId);
      return Result.success(jobs);
    } on NetworkException catch (e) {
      return Result.error(e.message);
    } on AuthException catch (e) {
      return Result.error(e.message);
    } on AppException catch (e) {
      return Result.error(e.message);
    } catch (e) {
      return Result.error('Failed to fetch customer jobs: ${e.toString()}');
    }
  }

  /// Get customer's active work orders (all work orders for the customer)
  Future<Result<List<WorkOrder>>> getCustomerWorkOrders(
    String customerId,
  ) async {
    try {
      final response = await _apiService.getWorkOrders(customerId: customerId);
      return Result.success(response.jobs);
    } on NetworkException catch (e) {
      return Result.error(e.message);
    } on AuthException catch (e) {
      return Result.error(e.message);
    } on AppException catch (e) {
      return Result.error(e.message);
    } catch (e) {
      return Result.error('Failed to fetch work orders: ${e.toString()}');
    }
  }
}
