import 'package:flutter/foundation.dart';
import '../../core/errors/exceptions.dart';
import '../../core/utils/result.dart';
import '../models/work_order.dart';
import '../services/api_service.dart';

/// Repository for work order operations.
/// Wraps ApiService work order methods with Result pattern,
/// implements client-side filtering, and provides user-friendly error messages.
class WorkOrderRepository {
  final ApiService _apiService;

  WorkOrderRepository(this._apiService);

  /// Get list of work orders with optional filters
  /// Supports client-side search filtering by job number, title, or customer name
  /// Returns Result with List<WorkOrder> on success or error message on failure
  Future<Result<List<WorkOrder>>> getWorkOrders({
    String? status,
    String? technicianId,
    String? customerId,
    String? searchQuery,
    int? page,
    int? limit,
  }) async {
    try {
      debugPrint('📦 WorkOrderRepository: Calling API service...');
      final response = await _apiService.getWorkOrders(
        status: status,
        technicianId: technicianId,
        customerId: customerId,
        page: page,
        limit: limit,
      );

      debugPrint(
        '📦 WorkOrderRepository: Got response with ${response.jobs.length} jobs',
      );
      var workOrders = response.jobs;

      // Apply client-side search filtering if search query is provided
      if (searchQuery != null && searchQuery.trim().isNotEmpty) {
        final query = searchQuery.toLowerCase().trim();
        workOrders = workOrders.where((order) {
          final jobNumber = order.id.toLowerCase();
          final title = order.title.toLowerCase();
          final customerName = (order.customerName ?? '').toLowerCase();

          return jobNumber.contains(query) ||
              title.contains(query) ||
              customerName.contains(query);
        }).toList();
        debugPrint(
          '📦 WorkOrderRepository: Filtered to ${workOrders.length} jobs',
        );
      }

      debugPrint(
        '✅ WorkOrderRepository: Returning ${workOrders.length} work orders',
      );
      return Result.success(workOrders);
    } on AuthException catch (e) {
      debugPrint('❌ WorkOrderRepository: AuthException - ${e.message}');
      return Result.error('Session expired. Please login again.');
    } on NetworkException catch (e) {
      debugPrint('❌ WorkOrderRepository: NetworkException - ${e.message}');
      return Result.error(e.message);
    } on AppException catch (e) {
      debugPrint('❌ WorkOrderRepository: AppException - ${e.message}');
      return Result.error(e.message);
    } catch (e, stackTrace) {
      debugPrint('❌ WorkOrderRepository: Unexpected exception');
      debugPrint('   Error: $e');
      debugPrint('   Type: ${e.runtimeType}');
      debugPrint('   Stack trace: $stackTrace');
      return Result.error('Failed to load work orders: ${e.toString()}');
    }
  }

  /// Get single work order by ID
  /// Returns Result with WorkOrder on success or error message on failure
  Future<Result<WorkOrder>> getWorkOrder(String id) async {
    try {
      if (id.isEmpty) {
        return Result.error('Work order ID is required');
      }

      final workOrder = await _apiService.getWorkOrder(id);
      return Result.success(workOrder);
    } on AuthException {
      return Result.error('Session expired. Please login again.');
    } on NetworkException catch (e) {
      return Result.error(e.message);
    } on AppException catch (e) {
      return Result.error(e.message);
    } catch (e) {
      return Result.error(
        'Failed to load work order details. Please try again.',
      );
    }
  }

  /// Update work order status
  /// Returns Result with updated WorkOrder on success or error message on failure
  Future<Result<WorkOrder>> updateWorkOrderStatus(
    String id,
    String status, {
    String? notes,
  }) async {
    try {
      if (id.isEmpty) {
        return Result.error('Work order ID is required');
      }

      if (status.isEmpty) {
        return Result.error('Status is required');
      }

      final workOrder = await _apiService.updateWorkOrderStatus(
        id,
        status,
        notes: notes,
      );
      return Result.success(workOrder);
    } on AuthException {
      return Result.error('Session expired. Please login again.');
    } on NetworkException catch (e) {
      return Result.error(e.message);
    } on AppException catch (e) {
      return Result.error(e.message);
    } catch (e) {
      return Result.error(
        'Failed to update work order status. Please try again.',
      );
    }
  }
}
