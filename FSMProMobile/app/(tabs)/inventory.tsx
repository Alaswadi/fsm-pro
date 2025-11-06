import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InventoryItem } from '../../src/types';
import { apiService } from '../../src/services/api';
import { Theme } from '@/constants/Theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterChip } from '@/components/ui/FilterChip';
import { ThemedText } from '@/components/ThemedText';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppFooter } from '@/components/ui/AppFooter';

type FilterType = 'all' | 'parts' | 'equipment' | 'supplies';

export default function InventoryScreen() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [searchQuery, inventory, filter]);

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getInventory();

      if (response.success && response.data) {
        const inventoryItems = response.data.inventory_items || [];
        setInventory(inventoryItems);
      } else {
        Alert.alert('Error', response.error || 'Failed to load inventory');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = inventory;

    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(item =>
        item.category?.toLowerCase() === filter.toLowerCase()
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.part_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredInventory(filtered);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadInventory();
    setIsRefreshing(false);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock === 0) {
      return { status: 'Out of Stock', color: Theme.colors.status.error };
    } else if (item.min_stock_level && item.current_stock <= item.min_stock_level) {
      return { status: 'Low Stock', color: Theme.colors.status.warning };
    } else {
      return { status: 'In Stock', color: Theme.colors.status.success };
    }
  };

  const getTotalItems = () => inventory.length;

  const getLowStockCount = () => {
    return inventory.filter(item =>
      item.min_stock_level && item.current_stock <= item.min_stock_level && item.current_stock > 0
    ).length;
  };

  const getOutOfStockCount = () => {
    return inventory.filter(item => item.current_stock === 0).length;
  };

  const getStockPercentage = (item: InventoryItem) => {
    if (!item.min_stock_level) return 100;
    const maxStock = item.min_stock_level * 2; // Assume max is 2x min
    return Math.min((item.current_stock / maxStock) * 100, 100);
  };

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {
    const stockStatus = getStockStatus(item);
    const stockPercentage = getStockPercentage(item);

    return (
      <Card style={styles.inventoryCard}>
        <View style={styles.itemRow}>
          {/* Item Icon */}
          <View style={styles.itemIcon}>
            <Text style={styles.itemIconEmoji}>🔧</Text>
          </View>

          {/* Item Info */}
          <View style={styles.itemContent}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleContainer}>
                <ThemedText type="subheading" style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </ThemedText>
                <Badge label={stockStatus.status} status={stockStatus.status} />
              </View>
            </View>

            <ThemedText type="caption" style={styles.itemCategory}>
              {item.category || 'Parts'}
            </ThemedText>

            {/* Stock Progress */}
            <View style={styles.stockInfo}>
              <ThemedText type="caption" style={styles.stockText}>
                {item.current_stock} / {item.min_stock_level ? item.min_stock_level * 2 : 100} units
              </ThemedText>
              <ThemedText type="caption" style={styles.partNumber}>
                {item.part_number}
              </ThemedText>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${stockPercentage}%`,
                    backgroundColor: stockStatus.color,
                  }
                ]}
              />
            </View>

            {/* Location and Actions */}
            <View style={styles.itemFooter}>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color={Theme.colors.text.tertiary} />
                <ThemedText type="caption" style={styles.locationText}>
                  Warehouse A - Section 2
                </ThemedText>
              </View>
              <View style={styles.actionIcons}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="create-outline" size={16} color={Theme.colors.text.secondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="refresh-outline" size={16} color={Theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary.DEFAULT} />
        <ThemedText type="body" style={styles.loadingText}>Loading inventory...</ThemedText>
      </View>
    );
  }

  const lowStockCount = getLowStockCount();

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader title="Inventory" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Theme.colors.primary.DEFAULT]}
            tintColor={Theme.colors.primary.DEFAULT}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="Search inventory items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <FilterChip
              label="All"
              active={filter === 'all'}
              onPress={() => setFilter('all')}
              style={styles.filterChip}
            />
            <FilterChip
              label="Parts"
              active={filter === 'parts'}
              onPress={() => setFilter('parts')}
              style={styles.filterChip}
            />
            <FilterChip
              label="Equipment"
              active={filter === 'equipment'}
              onPress={() => setFilter('equipment')}
              style={styles.filterChip}
            />
            <FilterChip
              label="Supplies"
              active={filter === 'supplies'}
              onPress={() => setFilter('supplies')}
              style={styles.filterChip}
            />
          </ScrollView>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCardBlue]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="cube-outline" size={24} color={Theme.colors.primary.DEFAULT} />
            </View>
            <ThemedText type="heading" style={styles.statNumber}>
              {getTotalItems().toLocaleString()}
            </ThemedText>
            <ThemedText type="caption" style={styles.statLabel}>Total Items</ThemedText>
          </View>

          <View style={[styles.statCard, styles.statCardOrange]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FDE68A' }]}>
              <Ionicons name="warning-outline" size={24} color={Theme.colors.status.warning} />
            </View>
            <ThemedText type="heading" style={[styles.statNumber, { color: Theme.colors.status.warning }]}>
              {getLowStockCount()}
            </ThemedText>
            <ThemedText type="caption" style={styles.statLabel}>Low Stock</ThemedText>
          </View>

          <View style={[styles.statCard, styles.statCardRed]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FECACA' }]}>
              <Ionicons name="close-circle-outline" size={24} color={Theme.colors.status.error} />
            </View>
            <ThemedText type="heading" style={[styles.statNumber, { color: Theme.colors.status.error }]}>
              {getOutOfStockCount()}
            </ThemedText>
            <ThemedText type="caption" style={styles.statLabel}>Out of Stock</ThemedText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color={Theme.colors.white} />
            <Text style={styles.addButtonText}>Add New Item</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scanButton}>
            <Ionicons name="barcode-outline" size={20} color={Theme.colors.text.primary} />
            <Text style={styles.scanButtonText}>Scan Barcode</Text>
          </TouchableOpacity>
        </View>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <View style={styles.alertBanner}>
            <View style={styles.alertContent}>
              <Ionicons name="warning" size={20} color={Theme.colors.status.warning} />
              <View style={styles.alertTextContainer}>
                <ThemedText type="subheading" style={styles.alertTitle}>
                  {lowStockCount} items need attention
                </ThemedText>
                <ThemedText type="caption" style={styles.alertSubtitle}>
                  Low stock levels detected
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.alertAction}>View All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertClose}>
              <Ionicons name="close" size={20} color={Theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Inventory Items Header */}
        <View style={styles.sectionHeader}>
          <ThemedText type="subheading" style={styles.sectionTitle}>Inventory Items</ThemedText>
        </View>

        {/* Inventory Items List */}
        <View style={styles.listContainer}>
          {filteredInventory.length > 0 ? (
            filteredInventory.map((item) => (
              <View key={item.id}>
                {renderInventoryItem({ item })}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color={Theme.colors.gray[300]} />
              <ThemedText type="subheading" style={styles.emptyText}>
                {searchQuery ? 'No items found' : 'No inventory items'}
              </ThemedText>
              <ThemedText type="body" style={styles.emptySubtext}>
                {searchQuery
                  ? `No items match "${searchQuery}"`
                  : 'Your inventory is empty'
                }
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color={Theme.colors.white} />
      </TouchableOpacity>

      {/* Footer */}
      <AppFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background.primary,
  },
  loadingText: {
    marginTop: Theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.white,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: Theme.typography.fontSizes.lg,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    backgroundColor: Theme.colors.background.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
  },
  filterWrapper: {
    backgroundColor: Theme.colors.background.primary,
    paddingVertical: Theme.spacing.sm,
  },
  filterContainer: {
    paddingHorizontal: Theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    marginRight: Theme.spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    paddingVertical: Theme.spacing.lg,
    alignItems: 'center',
  },
  statCardBlue: {
    backgroundColor: '#EFF6FF', // Light blue background
  },
  statCardOrange: {
    backgroundColor: '#FEF3C7', // Light orange/yellow background
  },
  statCardRed: {
    backgroundColor: '#FEE2E2', // Light red/pink background
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  statNumber: {
    fontSize: Theme.typography.fontSizes['2xl'],
    fontWeight: Theme.typography.fontWeights.bold,
    marginBottom: 2,
  },
  statLabel: {
    color: Theme.colors.text.secondary,
    fontSize: Theme.typography.fontSizes.xs,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.lg,
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary.DEFAULT,
    paddingVertical: 12,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.button,
    gap: Theme.spacing.xs,
  },
  addButtonText: {
    color: Theme.colors.white,
    fontSize: Theme.typography.fontSizes.sm,
    fontWeight: Theme.typography.fontWeights.medium,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.white,
    paddingVertical: 12,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.button,
    borderWidth: 1,
    borderColor: Theme.colors.gray[300],
    gap: Theme.spacing.xs,
  },
  scanButtonText: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.fontSizes.sm,
    fontWeight: Theme.typography.fontWeights.medium,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.button,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: Theme.typography.fontSizes.sm,
    fontWeight: Theme.typography.fontWeights.semibold,
    color: '#92400E',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: Theme.typography.fontSizes.xs,
    color: '#92400E',
  },
  alertAction: {
    color: '#F59E0B',
    fontSize: Theme.typography.fontSizes.sm,
    fontWeight: Theme.typography.fontWeights.medium,
    marginRight: Theme.spacing.xs,
  },
  alertClose: {
    padding: 2,
  },
  sectionHeader: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSizes.base,
    fontWeight: Theme.typography.fontWeights.semibold,
    color: Theme.colors.text.primary,
  },
  listContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 100,
  },
  inventoryCard: {
    marginBottom: Theme.spacing.sm,
    padding: Theme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  itemIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconEmoji: {
    fontSize: 28,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    marginBottom: 2,
  },
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: Theme.typography.fontSizes.base,
    fontWeight: Theme.typography.fontWeights.semibold,
    marginRight: Theme.spacing.sm,
  },
  itemCategory: {
    color: Theme.colors.text.secondary,
    fontSize: Theme.typography.fontSizes.xs,
    marginBottom: Theme.spacing.sm,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stockText: {
    color: Theme.colors.text.secondary,
    fontSize: Theme.typography.fontSizes.xs,
  },
  partNumber: {
    color: Theme.colors.text.tertiary,
    fontSize: Theme.typography.fontSizes.xs,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Theme.colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Theme.spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: Theme.colors.text.tertiary,
    fontSize: Theme.typography.fontSizes.xs,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  actionButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  emptySubtext: {
    textAlign: 'center',
    color: Theme.colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.lg,
  },
});
