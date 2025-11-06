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
import { Job } from '../src/types';
import { apiService } from '../src/services/api';

export default function WorkshopQueueScreen() {
  const [queueJobs, setQueueJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [claimingJobId, setClaimingJobId] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getWorkshopQueue({ sort_by: 'priority' });

      if (response.success && response.data) {
        setQueueJobs(response.data);
      } else {
        Alert.alert('Error', response.error || 'Failed to load workshop queue');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load workshop queue');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadQueue();
    setIsRefreshing(false);
  };

  const handleClaimJob = async (jobId: string) => {
    Alert.alert(
      'Claim Job',
      'Are you sure you want to claim this job?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Claim',
          onPress: async () => {
            try {
              setClaimingJobId(jobId);
              const response = await apiService.claimWorkshopJob(jobId);

              if (response.success) {
                Alert.alert('Success', 'Job claimed successfully');
                await loadQueue();
                router.push(`/work-order-details?id=${jobId}`);
              } else {
                Alert.alert('Error', response.error || 'Failed to claim job');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to claim job');
            } finally {
              setClaimingJobId(null);
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: Job['priority']) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return '#3B82F6';
      case 'in_repair': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const calculateDaysWaiting = (intakeDate: string) => {
    const intake = new Date(intakeDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - intake.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderQueueItem = ({ item }: { item: Job }) => {
    const daysWaiting = item.equipment_intake 
      ? calculateDaysWaiting(item.equipment_intake.intake_date)
      : 0;

    return (
      <View style={styles.queueCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.customerName}>{item.customer_name}</Text>
            <Text style={styles.equipmentInfo}>{item.equipment_info || 'Equipment'}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="alert-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText} numberOfLines={2}>
              {item.equipment_intake?.reported_issue || item.description}
            </Text>
          </View>

          {item.equipment_status && (
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={16} color="#8B5CF6" />
              <Text style={[styles.infoText, { color: getStatusColor(item.equipment_status.current_status) }]}>
                Status: {item.equipment_status.current_status.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              Waiting: {daysWaiting} {daysWaiting === 1 ? 'day' : 'days'}
            </Text>
          </View>

          {item.estimated_completion_date && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                Est. Completion: {new Date(item.estimated_completion_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push(`/work-order-details?id=${item.id}`)}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.claimButton,
              claimingJobId === item.id && styles.claimButtonDisabled
            ]}
            onPress={() => handleClaimJob(item.id)}
            disabled={claimingJobId === item.id}
          >
            {claimingJobId === item.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="hand-right-outline" size={16} color="white" />
                <Text style={styles.claimButtonText}>Claim Job</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading workshop queue...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Workshop Queue</Text>
          <Text style={styles.headerSubtitle}>
            {queueJobs.length} {queueJobs.length === 1 ? 'job' : 'jobs'} waiting
          </Text>
        </View>
      </View>

      <FlatList
        data={queueJobs}
        renderItem={renderQueueItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#8B5CF6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Queue is empty</Text>
            <Text style={styles.emptySubtext}>
              No equipment waiting for repair at the moment
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContainer: {
    padding: 20,
  },
  queueCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  equipmentInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  cardBody: {
    gap: 10,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  claimButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    gap: 6,
  },
  claimButtonDisabled: {
    opacity: 0.6,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
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
