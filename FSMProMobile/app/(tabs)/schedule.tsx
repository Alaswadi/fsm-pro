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
import { Calendar, DateData } from 'react-native-calendars';
import { Job } from '../../src/types';
import { apiService } from '../../src/services/api';

export default function ScheduleScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    loadAllScheduledJobs();
  }, []);

  useEffect(() => {
    filterJobsByDate();
  }, [selectedDate, allJobs]);

  const loadAllScheduledJobs = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all jobs to show in calendar
      const response = await apiService.getJobs({});
      
      console.log('Schedule API Response:', response);
      
      if (response.success && response.data) {
        const allJobsList = response.data.jobs || [];
        console.log('Total jobs fetched:', allJobsList.length);
        
        // Show all jobs that have a scheduled_date (regardless of status)
        const jobsWithDates = allJobsList.filter(job => 
          job.scheduled_date && job.status !== 'cancelled'
        );
        
        console.log('Jobs with scheduled dates:', jobsWithDates.length);
        console.log('Jobs data:', jobsWithDates);
        
        setAllJobs(jobsWithDates);
        generateMarkedDates(jobsWithDates);
      } else {
        console.error('Failed to load jobs:', response.error);
        Alert.alert('Error', response.error || 'Failed to load schedule');
      }
    } catch (error) {
      console.error('Exception loading jobs:', error);
      Alert.alert('Error', 'Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMarkedDates = (jobsList: Job[]) => {
    const marked: any = {};
    
    jobsList.forEach(job => {
      const dateKey = job.scheduled_date.split('T')[0];
      if (!marked[dateKey]) {
        marked[dateKey] = { 
          marked: true, 
          dotColor: '#ea2a33',
          dots: [{ color: '#ea2a33' }]
        };
      }
    });

    // Add selected date styling
    if (marked[selectedDate]) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#ea2a33',
      };
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#ea2a33',
      };
    }

    setMarkedDates(marked);
  };

  const filterJobsByDate = () => {
    const filteredJobs = allJobs.filter(job => 
      job.scheduled_date.startsWith(selectedDate)
    );
    setJobs(filteredJobs);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAllScheduledJobs();
    setIsRefreshing(false);
  };

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    const marked = { ...markedDates };
    
    // Remove previous selection
    Object.keys(marked).forEach(key => {
      if (marked[key].selected) {
        marked[key] = { ...marked[key], selected: false };
        delete marked[key].selectedColor;
      }
    });

    // Add new selection
    marked[day.dateString] = {
      ...marked[day.dateString],
      selected: true,
      selectedColor: '#ea2a33',
    };

    setMarkedDates(marked);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatSelectedDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'scheduled': return '#3B82F6';
      case 'in_progress': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
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
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#ea2a33']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Schedule</Text>
        </View>

        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={onDayPress}
            markedDates={markedDates}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#6B7280',
              selectedDayBackgroundColor: '#ea2a33',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#ea2a33',
              dayTextColor: '#111827',
              textDisabledColor: '#D1D5DB',
              dotColor: '#ea2a33',
              selectedDotColor: '#ffffff',
              arrowColor: '#ea2a33',
              monthTextColor: '#111827',
              indicatorColor: '#ea2a33',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />
        </View>

        <View style={styles.jobsSection}>
          <View style={styles.jobsHeader}>
            <Text style={styles.jobsHeaderTitle}>
              {formatSelectedDate(selectedDate)}
            </Text>
            <Text style={styles.jobsCount}>
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
            </Text>
          </View>

          {jobs.length > 0 ? (
            jobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => router.push(`/work-order-details?id=${job.id}`)}
              >
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatTime(job.scheduled_date)}</Text>
                  {job.estimated_duration && (
                    <Text style={styles.durationText}>
                      {job.estimated_duration}h
                    </Text>
                  )}
                </View>
                
                <View style={styles.jobContent}>
                  <View style={styles.jobTitleRow}>
                    <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                      <Text style={styles.statusText}>{job.status.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.customerName}>{job.customer_name || 'No customer'}</Text>
                  
                  <View style={styles.jobMeta}>
                    <View style={styles.priorityContainer}>
                      <View style={[
                        styles.priorityDot, 
                        { backgroundColor: getPriorityColor(job.priority) }
                      ]} />
                      <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
                    </View>
                    
                    {job.equipment_info && (
                      <Text style={styles.equipmentText} numberOfLines={1}>
                        {job.equipment_info}
                      </Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.actionContainer}>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No jobs scheduled</Text>
              <Text style={styles.emptySubtext}>
                You have no jobs scheduled for this date
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  calendarContainer: {
    backgroundColor: 'white',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  calendar: {
    paddingBottom: 10,
  },
  jobsSection: {
    padding: 20,
  },
  jobsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  jobsHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  jobsCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
  jobTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
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
