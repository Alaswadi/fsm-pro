import 'package:intl/intl.dart';

/// Utility class for date formatting
class DateFormatter {
  /// Formats date as "MMM dd, yyyy" (e.g., "Jan 15, 2024")
  static String formatDate(DateTime date) {
    return DateFormat('MMM dd, yyyy').format(date);
  }

  /// Formats date and time as "MMM dd, yyyy hh:mm a" (e.g., "Jan 15, 2024 02:30 PM")
  static String formatDateTime(DateTime dateTime) {
    return DateFormat('MMM dd, yyyy hh:mm a').format(dateTime);
  }

  /// Formats time as "hh:mm a" (e.g., "02:30 PM")
  static String formatTime(DateTime time) {
    return DateFormat('hh:mm a').format(time);
  }

  /// Formats date as "EEEE, MMM dd" (e.g., "Monday, Jan 15")
  static String formatDateWithDay(DateTime date) {
    return DateFormat('EEEE, MMM dd').format(date);
  }

  /// Formats date as "yyyy-MM-dd" for API requests
  static String formatDateForApi(DateTime date) {
    return DateFormat('yyyy-MM-dd').format(date);
  }

  /// Formats date and time for API requests (ISO 8601)
  static String formatDateTimeForApi(DateTime dateTime) {
    return dateTime.toIso8601String();
  }

  /// Returns relative time string (e.g., "2 hours ago", "Yesterday")
  static String formatRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      final minutes = difference.inMinutes;
      return '$minutes ${minutes == 1 ? 'minute' : 'minutes'} ago';
    } else if (difference.inHours < 24) {
      final hours = difference.inHours;
      return '$hours ${hours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return formatDate(dateTime);
    }
  }

  /// Checks if date is today
  static bool isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  /// Checks if date is in the past
  static bool isPast(DateTime date) {
    return date.isBefore(DateTime.now());
  }

  /// Checks if date is in the future
  static bool isFuture(DateTime date) {
    return date.isAfter(DateTime.now());
  }
}
