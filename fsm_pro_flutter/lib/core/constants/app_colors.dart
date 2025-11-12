import 'package:flutter/material.dart';

/// Color constants for FSM Pro app
class AppColors {
  // Primary colors
  static const Color primary = Color(0xFF2196F3);
  static const Color textPrimary = Color(0xFF1A1A1A);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color inputBackground = Color(0xFFF3F4F6);
  static const Color border = Color(0xFFE5E7EB);
  static const Color background = Color(0xFFFFFFFF);

  // Status colors
  static const Color statusScheduled = Color(0xFF3B82F6);
  static const Color statusInProgress = Color(0xFFF59E0B);
  static const Color statusCompleted = Color(0xFF10B981);
  static const Color statusCancelled = Color(0xFFEF4444);

  // Priority colors
  static const Color priorityLow = Color(0xFF9CA3AF);
  static const Color priorityMedium = Color(0xFFF59E0B);
  static const Color priorityHigh = Color(0xFFF97316);
  static const Color priorityUrgent = Color(0xFFEF4444);

  // Stock level colors
  static const Color stockAdequate = Color(0xFF3B82F6);
  static const Color stockLow = Color(0xFFF59E0B);
  static const Color stockCritical = Color(0xFFEF4444);
  static const Color stockOut = Color(0xFF9CA3AF);

  // Equipment status colors
  static const Color equipmentPending = Color(0xFF9CA3AF);
  static const Color equipmentInTransit = Color(0xFF3B82F6);
  static const Color equipmentReceived = Color(0xFF8B5CF6);
  static const Color equipmentInRepair = Color(0xFFF59E0B);
  static const Color equipmentCompleted = Color(0xFF10B981);
  static const Color equipmentReady = Color(0xFF06B6D4);

  // UI colors
  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);
}
