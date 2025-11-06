import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface PushNotificationData {
  type: 'job_assigned' | 'job_updated' | 'job_cancelled' | 'system_alert';
  jobId?: string;
  title: string;
  body: string;
  data?: any;
}

class PushNotificationService {
  private expoPushToken: string | null = null;

  // Initialize push notifications
  async initialize(): Promise<string | null> {
    try {
      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      // Get existing permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }

      // Get the Expo push token
      const token = await this.getExpoPushToken();
      
      if (token) {
        this.expoPushToken = token;
        await AsyncStorage.setItem('expo_push_token', token);
        console.log('Expo push token:', token);
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'FSM Pro Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#ea2a33',
        });
      }

      return token;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return null;
    }
  }

  // Get Expo push token
  private async getExpoPushToken(): Promise<string | null> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        console.log('Push notifications: No project ID configured. Remote push notifications will not work in Expo Go.');
        return null;
      }

      // Validate that projectId is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(projectId)) {
        console.log('Push notifications: Invalid project ID format. Please run "eas init" to set up your project, or use a development build for push notifications.');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return token.data;
    } catch (error) {
      // Silently handle errors in Expo Go since remote notifications aren't supported
      console.log('Push notifications: Unable to get push token. This is expected in Expo Go. Use a development build for full push notification support.');
      return null;
    }
  }

  // Get current push token
  getCurrentToken(): string | null {
    return this.expoPushToken;
  }

  // Send token to your backend
  async registerTokenWithBackend(userId: string): Promise<boolean> {
    try {
      if (!this.expoPushToken) {
        console.warn('No push token available to register');
        return false;
      }

      // Here you would send the token to your backend API
      // Example API call:
      /*
      const response = await apiService.registerPushToken({
        userId,
        token: this.expoPushToken,
        platform: Platform.OS,
      });
      
      return response.success;
      */

      // For now, just store it locally
      await AsyncStorage.setItem('push_token_registered', 'true');
      console.log('Push token registered for user:', userId);
      return true;
    } catch (error) {
      console.error('Error registering push token:', error);
      return false;
    }
  }

  // Schedule a local notification
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: trigger || null, // null means immediate
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return null;
    }
  }

  // Cancel a scheduled notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // Handle notification received while app is in foreground
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Handle notification response (when user taps notification)
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Get notification that opened the app
  async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    try {
      return await Notifications.getLastNotificationResponseAsync();
    } catch (error) {
      console.error('Error getting last notification response:', error);
      return null;
    }
  }

  // Clear all notifications from notification center
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Get badge count
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // Helper method to create job-related notifications
  async notifyJobUpdate(
    type: PushNotificationData['type'],
    jobTitle: string,
    jobId: string,
    customMessage?: string
  ): Promise<void> {
    let title = '';
    let body = customMessage || '';

    switch (type) {
      case 'job_assigned':
        title = 'New Job Assigned';
        body = body || `You have been assigned to: ${jobTitle}`;
        break;
      case 'job_updated':
        title = 'Job Updated';
        body = body || `Job "${jobTitle}" has been updated`;
        break;
      case 'job_cancelled':
        title = 'Job Cancelled';
        body = body || `Job "${jobTitle}" has been cancelled`;
        break;
      case 'system_alert':
        title = 'System Alert';
        body = body || 'You have a new system notification';
        break;
    }

    await this.scheduleLocalNotification(title, body, {
      type,
      jobId,
      jobTitle,
    });
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
