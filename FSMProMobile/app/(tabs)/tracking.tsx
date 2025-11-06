import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { FilterChip } from '@/components/ui/FilterChip';
import { Theme } from '@/constants/Theme';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppFooter } from '@/components/ui/AppFooter';

type FilterType = 'all' | 'available' | 'on_route';

interface Personnel {
  id: string;
  name: string;
  status: 'en_route' | 'on_site' | 'available';
  location: string;
  distance?: string;
  eta?: string;
  workOrder?: string;
  avatar: string;
  color: string;
}

export default function TrackingScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const insets = useSafeAreaInsets();

  const personnel: Personnel[] = [
    {
      id: '1',
      name: 'Mike Johnson',
      status: 'en_route',
      location: 'En route to Downtown Office',
      distance: '2.3 km',
      eta: '15 minutes',
      avatar: 'M',
      color: '#3B82F6',
    },
    {
      id: '2',
      name: 'Sarah Chen',
      status: 'on_site',
      location: 'At Riverside Mall',
      workOrder: 'WO-2024-002',
      avatar: 'S',
      color: '#3B82F6',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_route':
        return '#10B981'; // Green
      case 'on_site':
        return '#10B981'; // Green
      case 'available':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'en_route':
        return 'En route';
      case 'on_site':
        return 'On site';
      case 'available':
        return 'Available';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader title="Tracking" />

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {/* Filter Chips Overlay */}
        <View style={styles.filterOverlay}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <FilterChip
              label="All Personnel"
              active={filter === 'all'}
              onPress={() => setFilter('all')}
              style={styles.filterChip}
            />
            <FilterChip
              label="Available"
              active={filter === 'available'}
              onPress={() => setFilter('available')}
              style={styles.filterChip}
            />
            <FilterChip
              label="On Route"
              active={filter === 'on_route'}
              onPress={() => setFilter('on_route')}
              style={styles.filterChip}
            />
          </ScrollView>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={64} color={Theme.colors.gray[300]} />
          <ThemedText type="body" style={styles.mapText}>
            Map View
          </ThemedText>
        </View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapButton}>
            <Ionicons name="filter-outline" size={20} color={Theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapButton}>
            <Ionicons name="contract-outline" size={20} color={Theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.mapControlsRight}>
          <TouchableOpacity style={styles.mapButton}>
            <Ionicons name="add" size={20} color={Theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapButton}>
            <Ionicons name="filter" size={20} color={Theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Personnel List */}
      <View style={styles.personnelContainer}>
        <View style={styles.personnelHeader}>
          <ThemedText type="subheading" style={styles.personnelTitle}>
            Active Personnel
          </ThemedText>
          <TouchableOpacity>
            <Text style={styles.viewAllButton}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.personnelList}
          contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
          showsVerticalScrollIndicator={false}
        >
          {personnel.map((person) => (
            <Card key={person.id} style={styles.personnelCard}>
              <View style={styles.personnelRow}>
                <View style={[styles.avatar, { backgroundColor: person.color }]}>
                  <Text style={styles.avatarText}>{person.avatar}</Text>
                </View>
                <View style={styles.personnelInfo}>
                  <View style={styles.personnelNameRow}>
                    <ThemedText type="subheading" style={styles.personnelName}>
                      {person.name}
                    </ThemedText>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(person.status) }]} />
                  </View>
                  <ThemedText type="caption" style={styles.personnelLocation}>
                    {person.location}
                  </ThemedText>
                  {person.eta && (
                    <ThemedText type="caption" style={styles.personnelEta}>
                      ETA: {person.eta}
                    </ThemedText>
                  )}
                  {person.workOrder && (
                    <ThemedText type="caption" style={styles.personnelWorkOrder}>
                      Working on {person.workOrder}
                    </ThemedText>
                  )}
                </View>
                {person.distance && (
                  <View style={styles.distanceContainer}>
                    <Text style={styles.distanceText}>{person.distance}</Text>
                  </View>
                )}
                {person.status === 'on_site' && (
                  <View style={styles.onSiteContainer}>
                    <Text style={styles.onSiteText}>On site</Text>
                  </View>
                )}
              </View>
            </Card>
          ))}
        </ScrollView>
      </View>

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
  mapContainer: {
    height: 400,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  filterOverlay: {
    position: 'absolute',
    top: Theme.spacing.md,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  filterContainer: {
    paddingHorizontal: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  filterChip: {
    marginRight: Theme.spacing.sm,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    marginTop: Theme.spacing.md,
    color: Theme.colors.text.tertiary,
  },
  mapControls: {
    position: 'absolute',
    right: Theme.spacing.lg,
    top: 80,
    gap: Theme.spacing.sm,
  },
  mapControlsRight: {
    position: 'absolute',
    right: Theme.spacing.lg,
    bottom: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
    marginBottom: Theme.spacing.sm,
  },
  personnelContainer: {
    flex: 1,
    backgroundColor: Theme.colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -16,
    paddingTop: Theme.spacing.lg,
  },
  personnelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  personnelTitle: {
    fontSize: Theme.typography.fontSizes.base,
    fontWeight: Theme.typography.fontWeights.semibold,
  },
  viewAllButton: {
    fontSize: Theme.typography.fontSizes.sm,
    color: Theme.colors.primary.DEFAULT,
    fontWeight: Theme.typography.fontWeights.medium,
  },
  personnelList: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
  },
  personnelCard: {
    marginBottom: Theme.spacing.md,
  },
  personnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: Theme.typography.fontWeights.semibold,
    color: Theme.colors.white,
  },
  personnelInfo: {
    flex: 1,
  },
  personnelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: 2,
  },
  personnelName: {
    fontSize: Theme.typography.fontSizes.base,
    fontWeight: Theme.typography.fontWeights.semibold,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  personnelLocation: {
    fontSize: Theme.typography.fontSizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: 2,
  },
  personnelEta: {
    fontSize: Theme.typography.fontSizes.xs,
    color: Theme.colors.text.tertiary,
  },
  personnelWorkOrder: {
    fontSize: Theme.typography.fontSizes.xs,
    color: Theme.colors.text.tertiary,
  },
  distanceContainer: {
    marginLeft: Theme.spacing.md,
  },
  distanceText: {
    fontSize: Theme.typography.fontSizes.sm,
    color: Theme.colors.text.secondary,
  },
  onSiteContainer: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: 12,
    marginLeft: Theme.spacing.md,
  },
  onSiteText: {
    fontSize: Theme.typography.fontSizes.xs,
    color: '#10B981',
    fontWeight: Theme.typography.fontWeights.medium,
  },
  fab: {
    position: 'absolute',
    right: Theme.spacing.lg,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.lg,
  },
});

