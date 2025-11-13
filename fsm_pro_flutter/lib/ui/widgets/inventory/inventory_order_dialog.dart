import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/models/inventory_item.dart';
import '../../../providers/inventory_provider.dart';
import '../common/loading_indicator.dart';

/// Dialog for browsing and ordering inventory items for a work order
class InventoryOrderDialog extends StatefulWidget {
  final String workOrderId;

  const InventoryOrderDialog({super.key, required this.workOrderId});

  @override
  State<InventoryOrderDialog> createState() => _InventoryOrderDialogState();
}

class _InventoryOrderDialogState extends State<InventoryOrderDialog> {
  final Map<String, int> _selectedItems = {};
  bool _isProcessing = false;
  String? _searchQuery;

  @override
  void initState() {
    super.initState();
    // Load inventory when dialog opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InventoryProvider>().fetchInventory();
    });
  }

  void _updateQuantity(String itemId, int quantity) {
    setState(() {
      if (quantity <= 0) {
        _selectedItems.remove(itemId);
      } else {
        _selectedItems[itemId] = quantity;
      }
    });
  }

  Future<void> _processOrder() async {
    if (_selectedItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one item'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    setState(() {
      _isProcessing = true;
    });

    final success = await context
        .read<InventoryProvider>()
        .processInventoryOrder(
          workOrderId: widget.workOrderId,
          selectedItems: _selectedItems,
        );

    if (!mounted) return;

    setState(() {
      _isProcessing = false;
    });

    if (success) {
      Navigator.of(context).pop(true); // Return true to indicate success
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Order placed successfully!'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      final error = context.read<InventoryProvider>().error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error ?? 'Failed to process order'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  int _getTotalItems() {
    return _selectedItems.values.fold(0, (sum, qty) => sum + qty);
  }

  double _getTotalValue(List<InventoryItem> items) {
    double total = 0;
    for (var entry in _selectedItems.entries) {
      final item = items.firstWhere((i) => i.id == entry.key);
      total += item.unitPrice * entry.value;
    }
    return total;
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
          maxWidth: 600,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(4),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.inventory_2, color: Colors.white, size: 24),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Order Inventory',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close, color: Colors.white),
                  ),
                ],
              ),
            ),

            // Search bar
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Search inventory...',
                  prefixIcon: const Icon(Icons.search),
                  filled: true,
                  fillColor: AppColors.inputBackground,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                ),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                  context.read<InventoryProvider>().setSearchQuery(value);
                },
              ),
            ),

            // Inventory list
            Expanded(
              child: Consumer<InventoryProvider>(
                builder: (context, provider, child) {
                  if (provider.isLoading && provider.items.isEmpty) {
                    return const LoadingIndicator(
                      message: 'Loading inventory...',
                    );
                  }

                  final items = provider.filteredItems;

                  if (items.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.inventory_2_outlined,
                            size: 64,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _searchQuery?.isNotEmpty == true
                                ? 'No items found'
                                : 'No inventory available',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: items.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = items[index];
                      final selectedQty = _selectedItems[item.id] ?? 0;

                      return _buildInventoryItem(item, selectedQty);
                    },
                  );
                },
              ),
            ),

            // Order summary and actions
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                border: Border(top: BorderSide(color: Colors.grey[300]!)),
              ),
              child: Consumer<InventoryProvider>(
                builder: (context, provider, child) {
                  final totalValue = _getTotalValue(provider.items);
                  final totalItems = _getTotalItems();

                  return Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (totalItems > 0) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Total Items: $totalItems',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              '\$${totalValue.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                      ],
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _isProcessing
                                  ? null
                                  : () => Navigator.of(context).pop(),
                              child: const Text('Cancel'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: ElevatedButton.icon(
                              onPressed: _isProcessing ? null : _processOrder,
                              icon: _isProcessing
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor:
                                            AlwaysStoppedAnimation<Color>(
                                              Colors.white,
                                            ),
                                      ),
                                    )
                                  : const Icon(Icons.shopping_cart),
                              label: Text(
                                _isProcessing ? 'Processing...' : 'Place Order',
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInventoryItem(InventoryItem item, int selectedQty) {
    final stockLevel = item.stockLevel;
    final stockColor = _getStockLevelColor(stockLevel);

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: selectedQty > 0 ? AppColors.primary : AppColors.border,
          width: selectedQty > 0 ? 2 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Item info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (item.description != null && item.description!.isNotEmpty)
                    Text(
                      item.description!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: stockColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                            color: stockColor.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Text(
                          'Stock: ${item.currentStock}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: stockColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '\$${item.unitPrice.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Quantity controls
            const SizedBox(width: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    onPressed: selectedQty > 0
                        ? () => _updateQuantity(item.id, selectedQty - 1)
                        : null,
                    icon: const Icon(Icons.remove),
                    iconSize: 20,
                    padding: const EdgeInsets.all(8),
                    constraints: const BoxConstraints(
                      minWidth: 36,
                      minHeight: 36,
                    ),
                  ),
                  Container(
                    width: 40,
                    alignment: Alignment.center,
                    child: Text(
                      selectedQty.toString(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: selectedQty < item.currentStock
                        ? () => _updateQuantity(item.id, selectedQty + 1)
                        : null,
                    icon: const Icon(Icons.add),
                    iconSize: 20,
                    padding: const EdgeInsets.all(8),
                    constraints: const BoxConstraints(
                      minWidth: 36,
                      minHeight: 36,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStockLevelColor(StockLevel level) {
    switch (level) {
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
}
