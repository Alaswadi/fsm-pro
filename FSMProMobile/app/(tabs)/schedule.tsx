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
import { Job } from '../../src/types';
import { apiService } from '../../src/services/api';

export default function ScheduleScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadScheduledJobs();
  }, [selectedDate]);

  const loadScheduledJobs = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getJobs({ 
        status: 'scheduled',
        // You can add date filtering here if your API supports it
      });
      
      if (response.success && response.data) {
        // Filter jobs for the selected date (client-side filtering)
        const dateString = selectedDate.toISOString().split('T')[0];
        const filteredJobs = response.data.jobs.filter(job => 
          job.scheduled_date.startsWith(dateString)
        );
        setJobs(filteredJobs);
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
    await loadScheduledJobs();
    setIsRefreshing(false);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getNextDays = (days: number) => {
    const dates = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const renderDateButton = (date: Date) => {
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const isToday = date.toDateString() === new Date().toDateString();
    
    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={[
          styles.dateButton,
          isSelected && styles.dateButtonSelected
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text style={[
          styles.dateButtonDay,
          isSelected && styles.dateButtonTextSelected
        ]}>
          {date.toLocaleDateString([], { weekday: 'short' })}
        </Text>
        <Text style={[
          styles.dateButtonDate,
          isSelected && styles.dateButtonTextSelected,
          isToday && !isSelected && styles.todayText
        ]}>
          {date.getDate()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderJobItem = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => router.push(`/work-order-details?id=${item.id}`)}
    >
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(item.scheduled_date)}</Text>
        {item.estimated_duration && (
          <Text style={styles.durationText}>
            {item.estimated_duration}h estimated
          </Text>
        )}
      </View>
      
      <View style={styles.jobContent}>
        <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        
        <View style={styles.jobMeta}>
          <View style={styles.priorityContainer}>
            <View style={[
              styles.priorityDot, 
              { backgroundColor: getPriorityColor(item.priority) }
            ]} />
            <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
          </View>
          
          {item.equipment_info && (
            <Text style={styles.equipmentText} numberOfLines={1}>
              {item.equipment_info}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.actionContainer}>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  const getPriorityColor = (priority: Job['priority']) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea2a33" />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
        <Text style={styles.headerSubtitle}>
          {selectedDate.toLocaleDateString([], { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      <View style={styles.dateSelector}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={getNextDays(7)}
          renderItem={({ item }) => renderDateButton(item)}
          keyExtractor={(item) => item.toISOString()}
          contentContainerStyle={styles.dateSelectorContent}
        />
      </View>

      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#ea2a33']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No jobs scheduled</Text>
            <Text style={styles.emptySubtext}>
              You have no jobs scheduled for {selectedDate.toLocaleDateString()}
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
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  dateSelector: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateSelectorContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dateButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    minWidth: 60,
  },
  dateButtonSelected: {
    backgroundColor: '#ea2a33',
  },
  dateButtonDay: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  dateButtonDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dateButtonTextSelected: {
    color: 'white',
  },
  todayText: {
    color: '#ea2a33',
  },
  listContainer: {
    padding: 20,
  },
  jobCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timeContainer: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  jobContent: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  equipmentText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  actionContainer: {
    marginLeft: 12,
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
