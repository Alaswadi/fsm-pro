import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { pushNotificationService } from '../services/pushNotifications';
import { useAuth } from '../context/AuthContext';

export const usePushNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (isAuthenticated && user) {
      initializePushNotifications();
    }

    return () => {
      // Clean up listeners
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, user]);

  const initializePushNotifications = async () => {
    try {
      // Initialize push notification service
      const token = await pushNotificationService.initialize();
      
      if (token && user) {
        // Register token with backend
        await pushNotificationService.registerTokenWithBackend(user.id);
      }

      // Set up notification listeners
      setupNotificationListeners();

      // Check if app was opened by a notification
      checkInitialNotification();
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const setupNotificationListeners = () => {
    // Handle notifications received while app is in foreground
    notificationListener.current = pushNotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received in foreground:', notification);
        
        // You can customize how notifications are handled in foreground
        // For example, show a custom in-app notification
        handleForegroundNotification(notification);
      }
    );

    // Handle notification responses (when user taps notification)
    responseListener.current = pushNotificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        handleNotificationResponse(response);
      }
    );
  };

  const handleForegroundNotification = (notification: Notifications.Notification) => {
    const { data } = notification.request.content;
    
    // You can show a custom in-app notification here
    // or update the UI based on the notification type
    
    if (data?.type === 'job_assigned' || data?.type === 'job_updated') {
      // Optionally refresh job data or show a banner
      console.log('Job-related notification received:', data);
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const { data } = response.notification.request.content;
    
    // Navigate based on notification type
    if (data?.type === 'job_assigned' || data?.type === 'job_updated') {
      if (data.jobId) {
        // Navigate to job details
        router.push(`/work-order-details?id=${data.jobId}`);
      } else {
        // Navigate to work orders list
        router.push('/(tabs)');
      }
    } else if (data?.type === 'system_alert') {
      // Navigate to profile or settings
      router.push('/(tabs)/profile');
    } else {
      // Default navigation
      router.push('/(tabs)');
    }
  };

  const checkInitialNotification = async () => {
    try {
      const response = await pushNotificationService.getLastNotificationResponse();
      if (response) {
        // App was opened by a notification
        handleNotificationResponse(response);
      }
    } catch (error) {
      console.error('Error checking initial notification:', error);
    }
  };

  // Utility functions to send notifications
  const notifyJobAssigned = async (jobTitle: string, jobId: string) => {
    await pushNotificationService.notifyJobUpdate('job_assigned', jobTitle, jobId);
  };

  const notifyJobUpdated = async (jobTitle: string, jobId: string, message?: string) => {
    await pushNotificationService.notifyJobUpdate('job_updated', jobTitle, jobId, message);
  };

  const notifyJobCancelled = async (jobTitle: string, jobId: string) => {
    await pushNotificationService.notifyJobUpdate('job_cancelled', jobTitle, jobId);
  };

  const sendSystemAlert = async (message: string) => {
    await pushNotificationService.notifyJobUpdate('system_alert', 'System', 'system', message);
  };

  const clearAllNotifications = async () => {
    await pushNotificationService.clearAllNotifications();
  };

  const setBadgeCount = async (count: number) => {
    await pushNotificationService.setBadgeCount(count);
  };

  const getBadgeCount = async (): Promise<number> => {
    return await pushNotificationService.getBadgeCount();
  };

  return {
    // Notification utilities
    notifyJobAssigned,
    notifyJobUpdated,
    notifyJobCancelled,
    sendSystemAlert,
    clearAllNotifications,
    setBadgeCount,
    getBadgeCount,
    
    // Service access
    pushToken: pushNotificationService.getCurrentToken(),
  };
};

export default usePushNotifications;
