import '../../core/errors/exceptions.dart';
import '../../core/utils/result.dart';
import '../models/inventory_item.dart';
import '../services/api_service.dart';

/// Repository for inventory operations.
/// Wraps ApiService inventory methods with Result pattern,
/// implements client-side filtering, and provides user-friendly error messages.
class InventoryRepository {
  final ApiService _apiService;

  InventoryRepository(this._apiService);

  /// Get inventory items with optional search filtering
  /// Supports client-side search filtering by part number or name
  /// Returns Result with List<InventoryItem> on success or error message on failure
  Future<Result<List<InventoryItem>>> getInventory({
    String? searchQuery,
  }) async {
    try {
      var items = await _apiService.getInventory();

      // Apply client-side search filtering if search query is provided
      if (searchQuery != null && searchQuery.trim().isNotEmpty) {
        final query = searchQuery.toLowerCase().trim();
        items = items.where((item) {
          final partNumber = item.partNumber.toLowerCase();
          final name = item.name.toLowerCase();
          final description = (item.description ?? '').toLowerCase();

          return partNumber.contains(query) ||
              name.contains(query) ||
              description.contains(query);
        }).toList();
      }

      return Result.success(items);
    } on AuthException {
      return Result.error('Session expired. Please login again.');
    } on NetworkException catch (e) {
      return Result.error(e.message);
    } on AppException catch (e) {
      return Result.error(e.message);
    } catch (e) {
      return Result.error('Failed to load inventory. Please try again.');
    }
  }
}
