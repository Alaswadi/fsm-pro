import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Job } from '../../src/types';
import { apiService } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { Theme, getStatusColor } from '@/constants/Theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FilterChip } from '@/components/ui/FilterChip';
import { SearchBar } from '@/components/ui/SearchBar';
import { ThemedText } from '@/components/ThemedText';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppFooter } from '@/components/ui/AppFooter';

export default function WorkOrdersScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'urgent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadJobs();
  }, [filter]);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await apiService.getJobs(params);

      if (response.success && response.data) {
        setJobs(response.data.jobs || []);
      } else {
        Alert.alert('Error', response.error || 'Failed to load work orders');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load work orders');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadJobs();
    setIsRefreshing(false);
  };

  const getStatusLabel = (status: Job['status']) => {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Pending';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Past dates
    if (diffMs < 0) {
      const absDiffHours = Math.abs(diffHours);
      if (absDiffHours < 1) {
        return 'Just now';
      } else if (absDiffHours < 24) {
        return `${absDiffHours} hour${absDiffHours > 1 ? 's' : ''} ago`;
      } else if (absDiffHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString();
      }
    }

    // Future dates
    if (diffDays === 0) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (diffDays === 1) {
      return `Tomorrow ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (diffDays < 7) {
      return `${date.toLocaleDateString('en-US', { weekday: 'long' })} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.customer_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const renderJobItem = ({ item }: { item: Job }) => (
    <Card
      onPress={() => router.push(`/work-order-details?id=${item.id}`)}
      style={styles.jobCard}
    >
      <View style={styles.jobHeader}>
        <ThemedText type="subheading" style={styles.jobTitle}>
          {item.title}
        </ThemedText>
        <Badge label={getStatusLabel(item.status)} status={getStatusLabel(item.status) as any} />
      </View>

      <ThemedText type="body" style={styles.customerName}>
        {item.customer_name}
      </ThemedText>

      <View style={styles.jobFooter}>
        <ThemedText type="caption" style={styles.jobId}>
          {item.work_order_number || `WO-${item.id.substring(0, 8)}`}
        </ThemedText>
        <ThemedText type="caption" style={styles.jobTime}>
          {formatDate(item.scheduled_date)}
        </ThemedText>
      </View>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary.DEFAULT} />
        <ThemedText type="body" style={styles.loadingText}>Loading work orders...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader title="Work Orders" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Search work orders..."
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
            label="All Orders"
            active={filter === 'all'}
            onPress={() => setFilter('all')}
            style={styles.filterChip}
          />
          <FilterChip
            label="In Progress"
            active={filter === 'in_progress'}
            onPress={() => setFilter('in_progress')}
            style={styles.filterChip}
          />
          <FilterChip
            label="Completed"
            active={filter === 'completed'}
            onPress={() => setFilter('completed')}
            style={styles.filterChip}
          />
          <FilterChip
            label="Urgent"
            active={filter === 'urgent'}
            onPress={() => setFilter('urgent')}
            style={styles.filterChip}
          />
        </ScrollView>
      </View>

      {/* Work Orders List */}
      <FlatList
        data={filteredJobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Theme.colors.primary.DEFAULT]}
            tintColor={Theme.colors.primary.DEFAULT}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={64} color={Theme.colors.gray[300]} />
            <ThemedText type="subheading" style={styles.emptyText}>No work orders found</ThemedText>
            <ThemedText type="body" style={styles.emptySubtext}>
              {searchQuery
                ? 'Try adjusting your search'
                : filter === 'all'
                ? 'You have no work orders assigned yet'
                : `No ${filter.replace('_', ' ')} work orders found`
              }
            </ThemedText>
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
    backgroundColor: Theme.colors.white,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  filterWrapper: {
    backgroundColor: Theme.colors.white,
    paddingVertical: Theme.spacing.md,
  },
  filterContainer: {
    paddingHorizontal: Theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    marginRight: Theme.spacing.sm,
  },
  listContainer: {
    padding: Theme.spacing.lg,
  },
  jobCard: {
    marginBottom: Theme.spacing.md,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  jobTitle: {
    flex: 1,
    marginRight: Theme.spacing.md,
    fontSize: Theme.typography.fontSizes.base,
    fontWeight: Theme.typography.fontWeights.semibold,
    color: Theme.colors.text.primary,
  },
  customerName: {
    fontSize: Theme.typography.fontSizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.sm,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobId: {
    fontSize: Theme.typography.fontSizes.xs,
    color: Theme.colors.text.tertiary,
  },
  jobTime: {
    fontSize: Theme.typography.fontSizes.xs,
    color: Theme.colors.text.tertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  emptySubtext: {
    textAlign: 'center',
    paddingHorizontal: Theme.spacing['3xl'],
  },
});
