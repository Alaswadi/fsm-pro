import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';
import '../data/models/inventory_item.dart';
import '../data/repositories/inventory_repository.dart';

/// Provider for inventory state management.
/// Manages inventory list, search filtering, and stock level display.
class InventoryProvider extends ChangeNotifier {
  final InventoryRepository _inventoryRepository;

  List<InventoryItem> _items = [];
  String _searchQuery = '';
  bool _isLoading = false;
  String? _error;

  InventoryProvider({required InventoryRepository inventoryRepository})
    : _inventoryRepository = inventoryRepository;

  // ==================== Getters ====================

  /// All inventory items
  List<InventoryItem> get items => _items;

  /// Current search query
  String get searchQuery => _searchQuery;

  /// Loading state
  bool get isLoading => _isLoading;

  /// Error message
  String? get error => _error;

  /// Filtered inventory items based on search query
  List<InventoryItem> get filteredItems {
    if (_searchQuery.trim().isEmpty) {
      return _items;
    }

    final query = _searchQuery.toLowerCase().trim();
    return _items.where((item) {
      final partNumber = item.partNumber.toLowerCase();
      final name = item.name.toLowerCase();
      final description = (item.description ?? '').toLowerCase();

      return partNumber.contains(query) ||
          name.contains(query) ||
          description.contains(query);
    }).toList();
  }

  // ==================== Public Methods ====================

  /// Fetch inventory items from repository
  Future<void> fetchInventory() async {
    debugPrint('📦 InventoryProvider: Fetching inventory...');
    _setLoading(true);
    _clearError();

    final result = await _inventoryRepository.getInventory(
      searchQuery: _searchQuery.isNotEmpty ? _searchQuery : null,
    );

    if (result.isSuccess && result.data != null) {
      _items = result.data!;
      debugPrint('✅ InventoryProvider: Loaded ${_items.length} items');
      _setLoading(false);
    } else {
      debugPrint('❌ InventoryProvider: Failed - ${result.error}');
      _setError(result.error ?? 'Failed to load inventory');
      _setLoading(false);
    }
  }

  /// Set search query
  /// Triggers filtering of inventory items
  void setSearchQuery(String query) {
    if (_searchQuery != query) {
      _searchQuery = query;
      notifyListeners();
    }
  }

  /// Get stock level color for UI display
  /// Returns appropriate color based on stock level
  Color getStockLevelColor(InventoryItem item) {
    switch (item.stockLevel) {
      case StockLevel.adequate:
        return AppColors.stockAdequate;
      case StockLevel.low:
        return AppColors.stockLow;
      case StockLevel.critical:
        return AppColors.stockCritical;
      case StockLevel.outOfStock:
        return AppColors.stockOut;
    }
  }

  /// Get stock level text for UI display
  String getStockLevelText(InventoryItem item) {
    switch (item.stockLevel) {
      case StockLevel.adequate:
        return 'In Stock';
      case StockLevel.low:
        return 'Low Stock';
      case StockLevel.critical:
        return 'Critical';
      case StockLevel.outOfStock:
        return 'Out of Stock';
    }
  }

  /// Check if item needs warning indicator
  bool needsWarning(InventoryItem item) {
    return item.stockLevel == StockLevel.low ||
        item.stockLevel == StockLevel.critical ||
        item.stockLevel == StockLevel.outOfStock;
  }

  /// Calculate stock level percentage for progress bar
  /// Returns value between 0.0 and 1.0
  double getStockLevelPercentage(InventoryItem item) {
    if (item.maxStockLevel == 0) return 0.0;

    final percentage = item.currentStock / item.maxStockLevel;
    return percentage.clamp(0.0, 1.0);
  }

  /// Clear error message
  void clearError() {
    _clearError();
    notifyListeners();
  }

  /// Refresh inventory (convenience method)
  Future<void> refresh() async {
    await fetchInventory();
  }

  /// Process inventory order for a work order
  /// Returns true if successful, false otherwise
  Future<bool> processInventoryOrder({
    required String workOrderId,
    required Map<String, int> selectedItems,
  }) async {
    debugPrint(
      '📦 InventoryProvider: Processing order for work order $workOrderId',
    );
    _clearError();

    // Filter out items with quantity 0 and prepare the items list
    final itemsToOrder = selectedItems.entries
        .where((entry) => entry.value > 0)
        .map((entry) => {'item_id': entry.key, 'quantity': entry.value})
        .toList();

    if (itemsToOrder.isEmpty) {
      _setError('Please select at least one item to order');
      return false;
    }

    debugPrint('📦 InventoryProvider: Ordering ${itemsToOrder.length} items');

    final result = await _inventoryRepository.processInventoryOrder(
      workOrderId: workOrderId,
      items: itemsToOrder,
    );

    if (result.isSuccess) {
      debugPrint('✅ InventoryProvider: Order processed successfully');
      // Refresh inventory to get updated stock levels
      await fetchInventory();
      return true;
    } else {
      debugPrint('❌ InventoryProvider: Order failed - ${result.error}');
      _setError(result.error ?? 'Failed to process order');
      return false;
    }
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
