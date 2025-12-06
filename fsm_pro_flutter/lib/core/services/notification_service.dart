import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Background message handler - must be a top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('📩 Background message received: ${message.messageId}');
  debugPrint('   Title: ${message.notification?.title}');
  debugPrint('   Body: ${message.notification?.body}');
}

/// Service to handle Firebase Cloud Messaging and local notifications
class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  /// Android notification channel for high importance notifications
  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'fsm_pro_high_importance',
    'FSM Pro Notifications',
    description: 'High importance notifications for FSM Pro app',
    importance: Importance.high,
    playSound: true,
  );

  /// Initialize the notification service
  static Future<void> initialize() async {
    // Set background message handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request notification permissions
    final settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    debugPrint(
      '🔔 Notification permission status: ${settings.authorizationStatus}',
    );

    // Initialize local notifications for foreground display
    await _initializeLocalNotifications();

    // Create notification channel for Android
    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(_channel);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification tap when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Check if app was opened from a notification
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }

    // Get and log FCM token
    await _getAndLogToken();

    // Listen for token refresh
    _messaging.onTokenRefresh.listen((token) {
      debugPrint('🔄 FCM Token refreshed: $token');
      // TODO: Send new token to backend
    });
  }

  /// Initialize local notifications plugin
  static Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );

    const initSettings = InitializationSettings(android: androidSettings);

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (details) {
        debugPrint('📱 Local notification tapped: ${details.payload}');
        // TODO: Navigate based on payload
      },
    );
  }

  /// Handle foreground messages by showing a local notification
  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    debugPrint('📬 Foreground message received: ${message.messageId}');
    debugPrint('   Title: ${message.notification?.title}');
    debugPrint('   Body: ${message.notification?.body}');
    debugPrint('   Data: ${message.data}');

    final notification = message.notification;
    if (notification != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channel.id,
            _channel.name,
            channelDescription: _channel.description,
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
        ),
        payload: message.data.toString(),
      );
    }
  }

  /// Handle notification tap when app is in background/terminated
  static void _handleNotificationTap(RemoteMessage message) {
    debugPrint('👆 Notification tapped: ${message.messageId}');
    debugPrint('   Data: ${message.data}');

    // TODO: Navigate based on message data
    // Example: Navigate to work order if workOrderId is in data
    // final workOrderId = message.data['workOrderId'];
    // if (workOrderId != null) {
    //   Navigator.pushNamed(context, '/work-order/$workOrderId');
    // }
  }

  /// Get FCM token for this device
  static Future<String?> getToken() async {
    return await _messaging.getToken();
  }

  /// Get and log the FCM token
  static Future<void> _getAndLogToken() async {
    final token = await getToken();
    debugPrint('');
    debugPrint('═══════════════════════════════════════════════════════════');
    debugPrint('🔑 FCM TOKEN (use this to send test notifications):');
    debugPrint(token ?? 'Token not available');
    debugPrint('═══════════════════════════════════════════════════════════');
    debugPrint('');
  }

  /// Subscribe to a topic for group notifications
  static Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
    debugPrint('📌 Subscribed to topic: $topic');
  }

  /// Unsubscribe from a topic
  static Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
    debugPrint('📌 Unsubscribed from topic: $topic');
  }
}
