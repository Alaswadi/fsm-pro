import 'package:flutter/foundation.dart';

/// API endpoint constants for FSM Pro backend
class ApiConstants {
  // Base URL - includes /api prefix
  static const String baseUrl = 'https://fsmpro.phishsimulator.com/api';

  // Timeout
  static const Duration timeout = Duration(seconds: 30);

  // Log configuration on startup
  static void logConfiguration() {
    debugPrint('═══════════════════════════════════════════════════');
    debugPrint('🚀 FSM Pro API Configuration');
    debugPrint('═══════════════════════════════════════════════════');
    debugPrint('📍 Base URL: $baseUrl');
    debugPrint('⏱️  Timeout: ${timeout.inSeconds}s');
    debugPrint('🔐 Login endpoint: $baseUrl$login');
    debugPrint('📋 Jobs endpoint: $baseUrl$jobs');
    debugPrint('═══════════════════════════════════════════════════');
  }

  // Auth endpoints
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String profile = '/auth/profile';

  // Work order endpoints
  static const String jobs = '/jobs';
  static String jobDetails(String id) => '/jobs/$id';
  static String jobStatus(String id) => '/jobs/$id/status';

  // Inventory endpoints
  static const String inventory = '/inventory';

  // Workshop endpoints
  static const String workshopQueue = '/workshop/queue';
  static String workshopJobClaim(String id) => '/workshop/jobs/$id/claim';
  static String equipmentStatus(String jobId) => '/workshop/status/$jobId';
  static String equipmentStatusHistory(String jobId) =>
      '/workshop/status/$jobId/history';

  // Customer endpoints
  static String customerWorkshopJobs(String customerId) =>
      '/workshop/customer/$customerId/jobs';

  // Technician endpoints
  static String technicianAvailability(String id) =>
      '/technicians/$id/availability';
}
