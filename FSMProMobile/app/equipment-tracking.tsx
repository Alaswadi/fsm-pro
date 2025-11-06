import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Job, EquipmentStatus, EquipmentIntake, EquipmentStatusHistory } from '../src/types';
import { apiService } from '../src/services/api';

export default function EquipmentTrackingScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [equipmentStatus, setEquipmentStatus] = useState<EquipmentStatus | null>(null);
  const [intake, setIntake] = useState<EquipmentIntake | null>(null);
  const [statusHistory, setStatusHistory] = useState<EquipmentStatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      loadEquipmentDetails();
    }
  }, [jobId]);

  const loadEquipmentDetails = async () => {
    if (!jobId) return;
    
    try {
      setIsLoading(true);
      
      // Load job details
      const jobResponse = await apiService.getWorkshopJobDetails(jobId);
      if (jobResponse.success && jobResponse.data) {
        setJob(jobResponse.data);
      }
      
      // Load equipment status
      const statusResponse = await apiService.getEquipmentStatus(jobId);
      if (statusResponse.success && statusResponse.data) {
        setEquipmentStatus(statusResponse.data);
      }
      
      // Load intake details
      const intakeResponse = await apiService.getEquipmentIntake(jobId);
      if (intakeResponse.success && intakeResponse.data) {
        setIntake(intakeResponse.data);
      }
      
      // Load status history
      const historyResponse = await apiService.getEquipmentStatusHistory(jobId);
      if (historyResponse.success && historyResponse.data) {
        setStatusHistory(historyResponse.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load equipment details');
    } finally {
      setIsLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatusTimeline = () => {
    if (!equipmentStatus) return null;

    const statuses = [
      { key: 'pending_intake', label: 'Pending Intake', timestamp: equipmentStatus.pending_intake_at },
      { key: 'in_transit', label: 'In Transit', timestamp: equipmentStatus.in_transit_at },
      { key: 'received', label: 'Received', timestamp: equipmentStatus.received_at },
      { key: 'in_repair', label: 'In Repair', timestamp: equipmentStatus.in_repair_at },
      { key: 'repair_completed', label: 'Repair Completed', timestamp: equipmentStatus.repair_completed_at },
      { key: 'ready_for_pickup', label: 'Ready for Pickup', timestamp: equipmentStatus.ready_for_pickup_at },
      { key: 'out_for_delivery', label: 'Out for Delivery', timestamp: equipmentStatus.out_for_delivery_at },
      { key: 'returned', label: 'Returned', timestamp: equipmentStatus.returned_at },
    ];

    return (
      <View style={styles.timelineContainer}>
        {statuses.map((status, index) => {
          const isActive = status.timestamp !== null && status.timestamp !== undefined;
          const isCurrent = equipmentStatus.current_status === status.key;
          
          return (
            <View key={status.key} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot,
                  isActive && styles.timelineDotActive,
                  isCurrent && styles.timelineDotCurrent,
                  { backgroundColor: isActive ? getStatusColor(status.key) : '#E5E7EB' }
                ]} />
                {index < statuses.length - 1 && (
                  <View style={[
                    styles.timelineLine,
                    isActive && styles.timelineLineActive
                  ]} />
                )}
              </View>
              <View style={styles.timelineRight}>
                <Text style={[
                  styles.timelineLabel,
                  isActive && styles.timelineLabelActive,
                  isCurrent && styles.timelineLabelCurrent
                ]}>
                  {status.label}
                </Text>
                {status.timestamp && (
                  <Text style={styles.timelineTimestamp}>
                    {formatDate(status.timestamp)}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea2a33" />
        <Text style={styles.loadingText}>Loading equipment details...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Equipment not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Equipment Tracking</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Current Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="construct-outline" size={32} color="#ea2a33" />
            <View style={styles.statusHeaderText}>
              <Text style={styles.statusTitle}>Current Status</Text>
              {equipmentStatus && (
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(equipmentStatus.current_status) }
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {getStatusLabel(equipmentStatus.current_status)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.statusDetails}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobDescription}>{job.description}</Text>
            
            {job.estimated_completion_date && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text style={styles.detailLabel}>Estimated Completion:</Text>
                <Text style={styles.detailValue}>
                  {new Date(job.estimated_completion_date).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Status Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repair Progress</Text>
          {renderStatusTimeline()}
        </View>

        {/* Intake Information */}
        {intake && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipment Intake Details</Text>
            <View style={styles.intakeCard}>
              <View style={styles.intakeRow}>
                <Text style={styles.intakeLabel}>Reported Issue:</Text>
                <Text style={styles.intakeValue}>{intake.reported_issue}</Text>
              </View>
              
              {intake.visual_condition && (
                <View style={styles.intakeRow}>
                  <Text style={styles.intakeLabel}>Visual Condition:</Text>
                  <Text style={styles.intakeValue}>{intake.visual_condition}</Text>
                </View>
              )}
              
              {intake.accessories_included && (
                <View style={styles.intakeRow}>
                  <Text style={styles.intakeLabel}>Accessories:</Text>
                  <Text style={styles.intakeValue}>{intake.accessories_included}</Text>
                </View>
              )}
              
              <View style={styles.intakeRow}>
                <Text style={styles.intakeLabel}>Intake Date:</Text>
                <Text style={styles.intakeValue}>{formatDate(intake.intake_date)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Intake Photos */}
        {intake?.photos && intake.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipment Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
              {intake.photos.map((photo, index) => (
                <View key={photo.id || index} style={styles.photoContainer}>
                  <Image source={{ uri: photo.photo_url }} style={styles.photo} />
                  {photo.caption && (
                    <Text style={styles.photoCaption}>{photo.caption}</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Customer Notes */}
        {intake?.customer_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{intake.customer_notes}</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
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
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  statusDetails: {
    gap: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  jobDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  timelineContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  timelineDotActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  timelineDotCurrent: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  timelineLineActive: {
    backgroundColor: '#D1D5DB',
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  timelineLabelActive: {
    color: '#111827',
  },
  timelineLabelCurrent: {
    color: '#ea2a33',
    fontWeight: '600',
  },
  timelineTimestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  intakeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  intakeRow: {
    gap: 4,
  },
  intakeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  intakeValue: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  photosScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  photoContainer: {
    marginRight: 12,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  photoCaption: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    maxWidth: 200,
  },
  notesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
});
