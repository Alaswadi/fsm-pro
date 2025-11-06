import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Job } from '../../src/types';
import { apiService } from '../../src/services/api';
import { Theme } from '@/constants/Theme';
import { FilterChip } from '@/components/ui/FilterChip';
import { ThemedText } from '@/components/ThemedText';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppFooter } from '@/components/ui/AppFooter';

type ViewMode = 'day' | 'week' | 'month';
type FilterType = 'all' | 'high_priority' | 'maintenance' | 'inspection' | 'emergency';

export default function ScheduleScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(new Date().getDate());
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getJobs({});

      if (response.success && response.data) {
        setJobs(response.data.jobs || []);
      } else {
        Alert.alert('Error', response.error || 'Failed to load schedule');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadJobs();
    setIsRefreshing(false);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getMonthName = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{ day: number; isCurrentMonth: boolean; isToday: boolean }> = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        isToday: isCurrentMonth && today.getDate() === i,
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary.DEFAULT} />
        <ThemedText type="body" style={styles.loadingText}>Loading schedule...</ThemedText>
      </View>
    );
  }

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader title="Schedule" />

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
        <View style={styles.content}>
          {/* View Mode Toggle */}
          <View style={styles.viewModeContainer}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'day' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('day')}
            >
              <Text style={[styles.viewModeText, viewMode === 'day' && styles.viewModeTextActive]}>
                Day
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'week' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('week')}
            >
              <Text style={[styles.viewModeText, viewMode === 'week' && styles.viewModeTextActive]}>
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'month' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('month')}
            >
              <Text style={[styles.viewModeText, viewMode === 'month' && styles.viewModeTextActive]}>
                Month
              </Text>
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
              <Ionicons name="chevron-back" size={20} color={Theme.colors.text.secondary} />
            </TouchableOpacity>
            <ThemedText type="subheading" style={styles.monthTitle}>
              {getMonthName()}
            </ThemedText>
            <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
              <Ionicons name="chevron-forward" size={20} color={Theme.colors.text.secondary} />
            </TouchableOpacity>
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
                label="High Priority"
                active={filter === 'high_priority'}
                onPress={() => setFilter('high_priority')}
                style={styles.filterChip}
              />
              <FilterChip
                label="Maintenance"
                active={filter === 'maintenance'}
                onPress={() => setFilter('maintenance')}
                style={styles.filterChip}
              />
              <FilterChip
                label="Inspection"
                active={filter === 'inspection'}
                onPress={() => setFilter('inspection')}
                style={styles.filterChip}
              />
              <FilterChip
                label="Emergency"
                active={filter === 'emergency'}
                onPress={() => setFilter('emergency')}
                style={styles.filterChip}
              />
            </ScrollView>
          </View>

          {/* Calendar */}
          <View style={styles.calendarCard}>
            {/* Week Days Header */}
            <View style={styles.weekDaysRow}>
              {weekDays.map((day) => (
                <View key={day} style={styles.weekDayCell}>
                  <Text style={styles.weekDayText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {days.map((dayInfo, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    dayInfo.isToday && styles.todayCell,
                    selectedDate === dayInfo.day && dayInfo.isCurrentMonth && styles.selectedDayCell,
                  ]}
                  onPress={() => dayInfo.isCurrentMonth && setSelectedDate(dayInfo.day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !dayInfo.isCurrentMonth && styles.dayTextInactive,
                      dayInfo.isToday && styles.todayText,
                      selectedDate === dayInfo.day && dayInfo.isCurrentMonth && styles.selectedDayText,
                    ]}
                  >
                    {dayInfo.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  content: {
    padding: Theme.spacing.lg,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.gray[100],
    borderRadius: Theme.borderRadius.lg,
    padding: 4,
    marginBottom: Theme.spacing.lg,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: Theme.colors.white,
    ...Theme.shadows.sm,
  },
  viewModeText: {
    fontSize: Theme.typography.fontSizes.sm,
    fontWeight: Theme.typography.fontWeights.medium,
    color: Theme.colors.text.secondary,
  },
  viewModeTextActive: {
    color: Theme.colors.text.primary,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.lg,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  monthTitle: {
    fontSize: Theme.typography.fontSizes.xl,
    fontWeight: Theme.typography.fontWeights.semibold,
  },
  filterWrapper: {
    marginBottom: Theme.spacing.lg,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    marginRight: Theme.spacing.sm,
  },
  calendarCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.sm,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.sm,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  weekDayText: {
    fontSize: Theme.typography.fontSizes.xs,
    fontWeight: Theme.typography.fontWeights.medium,
    color: Theme.colors.text.tertiary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.borderRadius.md,
  },
  todayCell: {
    backgroundColor: Theme.colors.primary.DEFAULT,
  },
  selectedDayCell: {
    backgroundColor: Theme.colors.primary.DEFAULT,
  },
  dayText: {
    fontSize: Theme.typography.fontSizes.sm,
    fontWeight: Theme.typography.fontWeights.medium,
    color: Theme.colors.text.primary,
  },
  dayTextInactive: {
    color: Theme.colors.gray[300],
  },
  todayText: {
    color: Theme.colors.white,
  },
  selectedDayText: {
    color: Theme.colors.white,
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
