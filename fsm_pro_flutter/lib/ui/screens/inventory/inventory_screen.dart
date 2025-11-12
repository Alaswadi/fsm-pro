import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/inventory_provider.dart';
import '../../widgets/common/error_view.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/inventory/inventory_item_card.dart';

/// Screen for displaying and managing inventory items
class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Fetch inventory on screen load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InventoryProvider>().fetchInventory();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _handleRefresh() async {
    await context.read<InventoryProvider>().refresh();
  }

  void _handleSearch(String query) {
    context.read<InventoryProvider>().setSearchQuery(query);
  }

  void _clearSearch() {
    _searchController.clear();
    context.read<InventoryProvider>().setSearchQuery('');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Navigate to add inventory item screen
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Add inventory feature coming soon'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
            tooltip: 'Add Item',
          ),
        ],
      ),
      body: Column(
        children: [
          // Search field
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              onChanged: _handleSearch,
              decoration: InputDecoration(
                hintText: 'Search by part number or name',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: _clearSearch,
                      )
                    : null,
                filled: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          // Inventory list
          Expanded(
            child: Consumer<InventoryProvider>(
              builder: (context, provider, child) {
                // Loading state
                if (provider.isLoading && provider.items.isEmpty) {
                  return const LoadingIndicator();
                }

                // Error state
                if (provider.error != null && provider.items.isEmpty) {
                  return ErrorView(
                    message: provider.error!,
                    onRetry: () => provider.fetchInventory(),
                  );
                }

                // Empty state
                if (provider.filteredItems.isEmpty) {
                  return _buildEmptyState(provider);
                }

                // Success state with data
                return RefreshIndicator(
                  onRefresh: _handleRefresh,
                  child: ListView.builder(
                    itemCount: provider.filteredItems.length,
                    itemBuilder: (context, index) {
                      final item = provider.filteredItems[index];
                      return InventoryItemCard(
                        item: item,
                        onTap: () {
                          // TODO: Navigate to inventory item details
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Tapped on ${item.name}'),
                              duration: const Duration(seconds: 1),
                            ),
                          );
                        },
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(InventoryProvider provider) {
    final hasSearchQuery = provider.searchQuery.isNotEmpty;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              hasSearchQuery ? Icons.search_off : Icons.inventory_2_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              hasSearchQuery ? 'No items found' : 'No inventory items',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              hasSearchQuery
                  ? 'Try adjusting your search'
                  : 'Add items to get started',
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            if (hasSearchQuery) ...[
              const SizedBox(height: 16),
              TextButton(
                onPressed: _clearSearch,
                child: const Text('Clear search'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
