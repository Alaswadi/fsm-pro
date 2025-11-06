import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { apiService } from '../../src/services/api';
import { Technician } from '../../src/types';
import { Theme } from '@/constants/Theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppFooter } from '@/components/ui/AppFooter';

export default function ProfileScreen() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadTechnicianData();
  }, [user]);

  const loadTechnicianData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      // Get technician data for the current user
      const response = await apiService.getTechnicians();

      if (response.success && response.data) {
        // API returns {technicians, pagination}, not a direct array
        const technicians = (response.data as any).technicians || response.data;
        const technicianData = Array.isArray(technicians)
          ? technicians.find((t: any) => t.user_id === user.id)
          : null;
        if (technicianData) {
          setTechnician(technicianData);
          setIsAvailable(technicianData.is_available);
        } else {
          console.warn('No technician record found for user:', user.id);
        }
      } else {
        console.error('Failed to load technicians:', response.error);
      }
    } catch (error) {
      console.error('Error loading technician data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusToggle = async (value: boolean) => {
    if (!technician) return;
    
    setIsUpdatingStatus(true);
    try {
      // For the mobile app, we'll use a simple available/offline toggle
      // The backend expects 'available' or 'offline' status
      const newStatus = value ? 'available' : 'offline';
      const response = await apiService.updateTechnicianStatus(technician.id, newStatus);

      if (response.success) {
        setIsAvailable(value);
        setTechnician(prev => prev ? { ...prev, is_available: value } : null);
      } else {
        Alert.alert('Error', response.error || 'Failed to update status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        },
      ]
    );
  };

  const getStatusColor = (isAvailable: boolean) => {
    return isAvailable ? Theme.colors.success.DEFAULT : Theme.colors.gray[500];
  };

  const getStatusText = (isAvailable: boolean) => {
    return isAvailable ? 'Available' : 'Offline';
  };

  if (authLoading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary.DEFAULT} />
        <ThemedText type="body" style={styles.loadingText}>Loading profile...</ThemedText>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText type="subheading" style={styles.errorText}>User not found</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader title="Profile" showNotifications={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <Ionicons name="person" size={48} color={Theme.colors.gray[400]} />
            </View>
            <TouchableOpacity style={styles.editImageButton}>
              <Ionicons name="camera" size={14} color="white" />
            </TouchableOpacity>
          </View>

          <ThemedText type="title" style={styles.userName}>
            {user.full_name || 'Marcus Johnson'}
          </ThemedText>
          <ThemedText type="body" style={styles.userRole}>
            {user.role === 'technician' ? 'Field Service Manager' : user.role}
          </ThemedText>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <ThemedText type="subheading" style={styles.sectionTitle}>
            Contact Information
          </ThemedText>

          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="mail-outline" size={20} color={Theme.colors.text.secondary} />
            </View>
            <View style={styles.contactInfo}>
              <ThemedText type="body" style={styles.contactValue}>
                {user.email || 'marcus.johnson@fsmtech.com'}
              </ThemedText>
              <ThemedText type="caption" style={styles.contactLabel}>
                Work Email
              </ThemedText>
            </View>
          </View>

          {technician?.phone && (
            <View style={styles.contactItem}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="call-outline" size={20} color={Theme.colors.text.secondary} />
              </View>
              <View style={styles.contactInfo}>
                <ThemedText type="body" style={styles.contactValue}>
                  {technician.phone}
                </ThemedText>
                <ThemedText type="caption" style={styles.contactLabel}>
                  Mobile Phone
                </ThemedText>
              </View>
            </View>
          )}

          {technician?.address && (
            <View style={styles.contactItem}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="location-outline" size={20} color={Theme.colors.text.secondary} />
              </View>
              <View style={styles.contactInfo}>
                <ThemedText type="body" style={styles.contactValue}>
                  {technician.address}
                </ThemedText>
                <ThemedText type="caption" style={styles.contactLabel}>
                  Service Area
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="globe-outline" size={20} color={Theme.colors.text.secondary} />
            </View>
            <View style={styles.settingTextContainer}>
              <ThemedText type="body" style={styles.settingText}>
                Language
              </ThemedText>
            </View>
            <Text style={styles.settingValue}>English</Text>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="help-circle-outline" size={20} color={Theme.colors.text.secondary} />
            </View>
            <View style={styles.settingTextContainer}>
              <ThemedText type="body" style={styles.settingText}>
                Help & Support
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <ThemedText type="subheading" style={styles.sectionTitle}>
            Preferences
          </ThemedText>

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="notifications-outline" size={20} color={Theme.colors.text.secondary} />
            </View>
            <View style={styles.settingTextContainer}>
              <ThemedText type="body" style={styles.settingText}>
                Work Order Alerts
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                Get notified about new assignments
              </ThemedText>
            </View>
            <Switch
              value={true}
              trackColor={{ false: Theme.colors.gray[300], true: Theme.colors.primary.DEFAULT }}
              thumbColor={Theme.colors.white}
              ios_backgroundColor={Theme.colors.gray[300]}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="location-outline" size={20} color={Theme.colors.text.secondary} />
            </View>
            <View style={styles.settingTextContainer}>
              <ThemedText type="body" style={styles.settingText}>
                Location Sharing
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                Share location for job tracking
              </ThemedText>
            </View>
            <Switch
              value={true}
              trackColor={{ false: Theme.colors.gray[300], true: Theme.colors.primary.DEFAULT }}
              thumbColor={Theme.colors.white}
              ios_backgroundColor={Theme.colors.gray[300]}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="cloud-offline-outline" size={20} color={Theme.colors.text.secondary} />
            </View>
            <View style={styles.settingTextContainer}>
              <ThemedText type="body" style={styles.settingText}>
                Offline Mode
              </ThemedText>
              <ThemedText type="caption" style={styles.settingDescription}>
                Download data for offline access
              </ThemedText>
            </View>
            <Switch
              value={false}
              trackColor={{ false: Theme.colors.gray[300], true: Theme.colors.primary.DEFAULT }}
              thumbColor={Theme.colors.white}
              ios_backgroundColor={Theme.colors.gray[300]}
            />
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Theme.colors.text.secondary} />
            </View>
            <View style={styles.settingTextContainer}>
              <ThemedText type="body" style={styles.settingText}>
                Change Password
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="download-outline" size={20} color={Theme.colors.text.secondary} />
            </View>
            <View style={styles.settingTextContainer}>
              <ThemedText type="body" style={styles.settingText}>
                Export Data
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Theme.colors.error.DEFAULT} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background.primary,
  },
  errorText: {
    color: Theme.colors.error.DEFAULT,
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
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Theme.typography.fontSizes.lg,
  },
  settingsButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: Theme.colors.white,
    alignItems: 'center',
    paddingVertical: Theme.spacing['3xl'],
    paddingHorizontal: Theme.spacing.lg,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: Theme.spacing.lg,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Theme.colors.white,
    ...Theme.shadows.md,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Theme.colors.primary.DEFAULT,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Theme.colors.white,
  },
  userName: {
    marginBottom: Theme.spacing.xs,
    fontSize: Theme.typography.fontSizes.xl,
    fontWeight: Theme.typography.fontWeights.semibold,
  },
  userRole: {
    color: Theme.colors.text.secondary,
    fontSize: Theme.typography.fontSizes.base,
  },
  section: {
    backgroundColor: Theme.colors.white,
    marginTop: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.typography.fontSizes.base,
    fontWeight: Theme.typography.fontWeights.semibold,
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactValue: {
    fontSize: Theme.typography.fontSizes.base,
    marginBottom: 2,
  },
  contactLabel: {
    fontSize: Theme.typography.fontSizes.sm,
    color: Theme.colors.text.tertiary,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.gray[100],
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontSize: Theme.typography.fontSizes.base,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: Theme.typography.fontSizes.sm,
    color: Theme.colors.text.tertiary,
  },
  settingValue: {
    fontSize: Theme.typography.fontSizes.base,
    color: Theme.colors.text.tertiary,
    marginRight: Theme.spacing.sm,
  },
  signOutContainer: {
    marginTop: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    gap: Theme.spacing.sm,
  },
  signOutText: {
    fontSize: Theme.typography.fontSizes.base,
    fontWeight: Theme.typography.fontWeights.medium,
    color: Theme.colors.error.DEFAULT,
  },
});
