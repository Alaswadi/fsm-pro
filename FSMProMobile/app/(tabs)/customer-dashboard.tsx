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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Job } from '../../src/types';
import { apiService } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { Theme } from '@/constants/Theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ThemedText } from '@/components/ThemedText';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppFooter } from '@/components/ui/AppFooter';

export default function CustomerDashboardScreen() {
  const [workshopJobs, setWorkshopJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadWorkshopJobs();
  }, []);

  const loadWorkshopJobs = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Get customer ID from user
      // In a real implementation, you'd need to fetch the customer record associated with this user
      // For now, we'll use a placeholder approach
      const response = await apiService.getJobs({ 
        location_type: 'workshop',
        customer_id: user.id // This assumes user.id maps to customer_id
      });

      if (response.success && response.data) {
        setWorkshopJobs(response.data.jobs || []);
      } else {
        Alert.alert('Error', response.error || 'Failed to load workshop equipment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load workshop equipment');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadWorkshopJobs();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_intake': return '#9CA3AF';
      case 'in_transit': return '#3B82F6';
      case 'received': return '#8B5CF6';
      case 'in_repair': return '#F59E0B';
      case 'repair_completed': return '#10B981';
      case 'ready_for_pickup': return '#06B6D4';
      case 'out_for_delivery': return '#3B82F6';
      case 'returned': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderEquipmentCard = ({ item }: { item: Job }) => {
    const currentStatus = item.equipment_status?.current_status || 'pending_intake';
    
    return (
      <TouchableOpacity
        style={styles.equipmentCard}
        onPress={() => router.push(`/equipment-tracking?jobId=${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="construct-outline" size={24} color="#ea2a33" />
            <View style={styles.cardHeaderText}>
              <Text style={styles.equipmentTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.equipmentDescription} numberOfLines={1}>
                {item.description}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(currentStatus) }
            ]}>
              <Text style={styles.statusBadgeText}>
                {getStatusLabel(currentStatus)}
              </Text>
            </View>
          </View>

          {item.estimated_completion_date && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.infoLabel}>Est. Completion:</Text>
              <Text style={styles.infoValue}>
                {new Date(item.estimated_completion_date).toLocaleDateString()}
              </Text>
            </View>
          )}

          {item.equipment_info && (
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.infoLabel}>Equipment:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{item.equipment_info}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailsText}>Tap to view details</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary.DEFAULT} />
        <ThemedText type="body" style={styles.loadingText}>Loading your equipment...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader title="My Equipment" />

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{workshopJobs.length}</Text>
          <Text style={styles.summaryLabel}>Equipment in Workshop</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {workshopJobs.filter(j => 
              j.equipment_status?.current_status === 'in_repair'
            ).length}
          </Text>
          <Text style={styles.summaryLabel}>Currently in Repair</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {workshopJobs.filter(j => 
              j.equipment_status?.current_status === 'ready_for_pickup' ||
              j.equipment_status?.current_status === 'out_for_delivery'
            ).length}
          </Text>
          <Text style={styles.summaryLabel}>Ready for Return</Text>
        </View>
      </View>

      <FlatList
        data={workshopJobs}
        renderItem={renderEquipmentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#ea2a33']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No equipment in workshop</Text>
            <Text style={styles.emptySubtext}>
              You don't have any equipment currently being serviced at our workshop
            </Text>
          </View>
        }
      />

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
    backgroundColor: Theme.colors.white,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  headerTitle: {
    marginBottom: Theme.spacing.xs,
  },
  headerSubtitle: {
    color: Theme.colors.text.secondary,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.white,
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.sm,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ea2a33',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  listContainer: {
    padding: 20,
  },
  equipmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  equipmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  equipmentDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  cardFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#ea2a33',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
