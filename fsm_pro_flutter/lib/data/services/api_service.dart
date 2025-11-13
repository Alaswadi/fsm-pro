import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../core/constants/api_constants.dart';
import '../../core/errors/exceptions.dart';
import '../models/api_response.dart';
import '../models/user.dart';
import '../models/work_order.dart';
import '../models/inventory_item.dart';
import '../models/inventory_order.dart';
import '../models/equipment_status.dart';
import 'storage_service.dart';

/// Main API service for communicating with the FSM Pro backend.
/// Handles all HTTP requests, authentication, and error handling.
class ApiService {
  final Dio _dio;
  final StorageService _storage;

  ApiService(this._storage) : _dio = Dio() {
    _initializeDio();
    _setupInterceptors();
  }

  /// Initialize Dio with base configuration
  void _initializeDio() {
    debugPrint(
      '🌐 API Service: Initializing with base URL: ${ApiConstants.baseUrl}',
    );
    _dio.options = BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: ApiConstants.timeout,
      receiveTimeout: ApiConstants.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      validateStatus: (status) {
        // Accept all status codes to handle them manually
        return status != null && status < 500;
      },
    );
    debugPrint('✅ API Service: Initialization complete');
  }

  /// Set up request and response interceptors
  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          debugPrint('📤 API Request: ${options.method} ${options.uri}');
          debugPrint('   Headers: ${options.headers}');
          if (options.data != null) {
            // Don't log passwords
            if (options.uri.path.contains('login')) {
              debugPrint('   Data: [LOGIN DATA HIDDEN]');
            } else {
              debugPrint('   Data: ${options.data}');
            }
          }

          // Add auth token to all requests if available
          final token = await _storage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
            debugPrint('   Auth: Token added');
          }
          return handler.next(options);
        },
        onResponse: (response, handler) {
          debugPrint(
            '📥 API Response: ${response.statusCode} ${response.requestOptions.uri}',
          );
          debugPrint('   Data: ${response.data}');
          return handler.next(response);
        },
        onError: (error, handler) async {
          debugPrint('❌ API Error: ${error.requestOptions.uri}');
          debugPrint('   Type: ${error.type}');
          debugPrint('   Message: ${error.message}');
          if (error.response != null) {
            debugPrint('   Status: ${error.response?.statusCode}');
            debugPrint('   Data: ${error.response?.data}');
          }

          // Handle 401 Unauthorized - clear auth and redirect to login
          if (error.response?.statusCode == 401) {
            debugPrint('   Action: Clearing auth due to 401');
            await _storage.clearAuth();
            // The provider layer will handle navigation
          }
          return handler.next(error);
        },
      ),
    );
  }

  // ==================== Error Handling Helper Methods ====================

  /// Handle API errors and convert to appropriate exceptions
  Exception _handleError(DioException error) {
    debugPrint('🔧 Handling error type: ${error.type}');

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        debugPrint('   → Timeout error');
        return NetworkException(
          'Connection timeout. Please check your internet connection.',
        );

      case DioExceptionType.connectionError:
        debugPrint('   → Connection error: ${error.message}');
        return NetworkException(
          'Unable to connect to server. Please check your internet connection.',
        );

      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final message = _extractErrorMessage(error.response?.data);

        if (statusCode == 401) {
          return AuthException('Authentication failed. Please login again.');
        } else if (statusCode == 403) {
          return AuthException('Access denied. You do not have permission.');
        } else if (statusCode == 404) {
          return AppException('Resource not found.');
        } else if (statusCode != null &&
            statusCode >= 400 &&
            statusCode < 500) {
          return AppException(message ?? 'Request failed. Please try again.');
        } else {
          return AppException(
            message ?? 'Server error. Please try again later.',
          );
        }

      case DioExceptionType.cancel:
        return AppException('Request cancelled.');

      case DioExceptionType.unknown:
      default:
        return NetworkException(
          'An unexpected error occurred. Please try again.',
        );
    }
  }

  /// Extract error message from response data
  String? _extractErrorMessage(dynamic data) {
    if (data == null) return null;

    if (data is Map<String, dynamic>) {
      return data['error'] ?? data['message'] ?? data['msg'];
    }

    if (data is String) {
      return data;
    }

    return null;
  }

  /// Wrap API call with error handling
  Future<T> _handleRequest<T>(Future<Response> Function() request) async {
    try {
      final response = await request();
      return response.data as T;
    } on DioException catch (e) {
      throw _handleError(e);
    } catch (e, stackTrace) {
      debugPrint('❌ Unexpected error in _handleRequest:');
      debugPrint('   Error: $e');
      debugPrint('   Stack trace: $stackTrace');
      throw AppException('An unexpected error occurred: ${e.toString()}');
    }
  }

  // ==================== Authentication API Methods ====================

  /// Login with email and password
  /// POST /api/auth/login
  Future<AuthResponse> login(String email, String password) async {
    debugPrint('🔐 Attempting login for: $email');
    debugPrint('   API URL: ${ApiConstants.baseUrl}${ApiConstants.login}');

    final response = await _handleRequest<Map<String, dynamic>>(
      () => _dio.post(
        ApiConstants.login,
        data: {'email': email, 'password': password},
      ),
    );

    debugPrint('✅ Login successful, parsing response...');
    debugPrint('   Response structure: ${response.keys}');

    // Handle the nested response structure: {success: true, data: {user: {...}, token: ...}}
    if (response['success'] == true && response['data'] != null) {
      final data = response['data'] as Map<String, dynamic>;
      final authResponse = AuthResponse.fromJson(data);

      // Store token and user data
      debugPrint('💾 Storing auth token and user data...');
      await _storage.saveToken(authResponse.token);
      await _storage.saveUser(authResponse.user);
      debugPrint('✅ Auth data stored successfully');

      return authResponse;
    } else {
      // Handle error response
      final error = response['error'] ?? 'Login failed';
      debugPrint('❌ Login failed: $error');
      throw AuthException(error);
    }
  }

  /// Logout current user
  /// POST /api/auth/logout
  Future<void> logout() async {
    try {
      await _handleRequest<Map<String, dynamic>>(
        () => _dio.post(ApiConstants.logout),
      );
    } finally {
      // Always clear local storage even if API call fails
      await _storage.clearAuth();
    }
  }

  /// Get current user profile
  /// GET /api/auth/profile
  Future<User> getProfile() async {
    final response = await _handleRequest<Map<String, dynamic>>(
      () => _dio.get(ApiConstants.profile),
    );

    // Handle nested response structure
    final userData = response['success'] == true && response['data'] != null
        ? response['data']['user'] ?? response['data']
        : response['user'] ?? response;

    final user = User.fromJson(userData);
    await _storage.saveUser(user);

    return user;
  }

  // ==================== Work Order API Methods ====================

  /// Get list of work orders with optional filters
  /// GET /api/jobs
  Future<WorkOrderListResponse> getWorkOrders({
    String? status,
    String? technicianId,
    String? customerId,
    int? page,
    int? limit,
  }) async {
    final queryParameters = <String, dynamic>{};

    if (status != null) queryParameters['status'] = status;
    if (technicianId != null) queryParameters['technician_id'] = technicianId;
    if (customerId != null) queryParameters['customer_id'] = customerId;
    if (page != null) queryParameters['page'] = page;
    if (limit != null) queryParameters['limit'] = limit;

    final response = await _handleRequest<Map<String, dynamic>>(
      () => _dio.get(ApiConstants.jobs, queryParameters: queryParameters),
    );

    // Handle nested response structure
    final data = response['success'] == true && response['data'] != null
        ? response['data']
        : response;

    return WorkOrderListResponse.fromJson(data);
  }

  /// Get single work order by ID
  /// GET /api/jobs/:id
  Future<WorkOrder> getWorkOrder(String id) async {
    final response = await _handleRequest<Map<String, dynamic>>(
      () => _dio.get(ApiConstants.jobDetails(id)),
    );

    // Handle nested response structure
    final jobData = response['success'] == true && response['data'] != null
        ? response['data']['job'] ?? response['data']
        : response['job'] ?? response;

    return WorkOrder.fromJson(jobData);
  }

  /// Update work order status
  /// PATCH /api/jobs/:id/status
  Future<WorkOrder> updateWorkOrderStatus(
    String id,
    String status, {
    String? notes,
  }) async {
    final requestData = <String, dynamic>{'status': status};
    if (notes != null && notes.isNotEmpty) {
      requestData['notes'] = notes;
    }

    final response = await _handleRequest<Map<String, dynamic>>(
      () => _dio.patch(ApiConstants.jobStatus(id), data: requestData),
    );

    // Handle nested response structure
    final jobData = response['success'] == true && response['data'] != null
        ? response['data']['job'] ?? response['data']
        : response['job'] ?? response;

    return WorkOrder.fromJson(jobData);
  }

  // ==================== Inventory API Methods ====================

  /// Get inventory items
  /// GET /api/inventory
  Future<List<InventoryItem>> getInventory() async {
    final response = await _handleRequest<Map<String, dynamic>>(
      () => _dio.get(ApiConstants.inventory),
    );

    // Handle nested response structure
    // API returns: {success: true, data: {inventory_items: [...], pagination: {...}}}
    final items = response['success'] == true && response['data'] != null
        ? response['data']['inventory_items'] ??
              response['data']['items'] ??
              response['data']
        : response['inventory_items'] ??
              response['items'] ??
              response['data'] ??
              [];

    return (items as List).map((item) => InventoryItem.fromJson(item)).toList();
  }

  /// Process inventory order for a work order
  /// POST /api/inventory/order
  Future<Map<String, dynamic>> processInventoryOrder({
    required String workOrderId,
    required List<Map<String, dynamic>> items,
  }) async {
    final requestData = {'work_order_id': workOrderId, 'items': items};

    final response = await _handleRequest<Map<String, dynamic>>(
      () => _dio.post(ApiConstants.inventoryOrder, data: requestData),
    );

    // Return the full response data
    return response['success'] == true && response['data'] != null
        ? response['data']
        : response;
  }

  /// Get inventory orders for a work order
  /// GET /api/inventory/work-orders/:workOrderId/orders
  Future<(List<InventoryOrder>, InventoryOrderSummary)>
  getWorkOrderInventoryOrders(String workOrderId) async {
    final response = await _handleRequest<Map<String, dynamic>>(
      () => _dio.get(ApiConstants.workOrderInventoryOrders(workOrderId)),
    );

    // Handle nested response structure
    final data = response['success'] == true && response['data'] != null
        ? response['data']
        : response;

    final ordersData = data['orders'] ?? [];
    final summaryData = data['summary'] ?? {};

    final orders = (ordersData as List)
        .map((order) => InventoryOrder.fromJson(order))
        .toList();

    final summary = InventoryOrderSummary.fromJson(summaryData);

    return (orders, summary);
  }

  // ==================== Workshop API Methods ====================

  /// Get workshop queue
  /// GET /api/workshop/queue
  Future<List<WorkOrder>> getWorkshopQueue() async {
    final response = await _handleRequest<Map<String, dynamic>>(
      () => _dio.get(ApiConstants.workshopQueue),
    );

    // Handle nested response structure
    final jobs = response['success'] == true && response['data'] != null
        ? response['data']['jobs'] ?? response['data']
        : response['jobs'] ?? response['data'] ?? [];

    return (jobs as List).map((job) => WorkOrder.fromJson(job)).toList();
  }

  /// Claim a workshop job
  /// POST /api/workshop/jobs/:id/claim
  Future<WorkOrder> claimWorkshopJob(String jobId) async {
    final response = await _handleRequest<Map<String, dynamic>>(
      () => _dio.post(ApiConstants.workshopJobClaim(jobId)),
    );

    // Handle nested response structure
    final jobData = response['success'] == true && response['data'] != null
        ? response['data']['job'] ?? response['data']
        : response['job'] ?? response;

    return WorkOrder.fromJson(jobData);
  }

  /// Get equipment status for a job
  /// GET /api/workshop/status/:jobId
  Future<EquipmentStatus> getEquipmentStatus(String jobId) async {
    final response = await _handleRequest<Map<String, dynamic>>(
      () => _dio.get(ApiConstants.equipmentStatus(jobId)),
    );

    // Handle nested response structure
    final statusData = response['success'] == true && response['data'] != null
        ? response['data']['status'] ?? response['data']
        : response['status'] ?? response;

    return EquipmentStatus.fromJson(statusData);
  }

  /// Update equipment status
  /// PUT /api/workshop/status/:jobId
  Future<EquipmentStatus> updateEquipmentStatus(
    String jobId,
    String status, {
    String? notes,
  }) async {
    final requestData = <String, dynamic>{'status': status};
    if (notes != null && notes.isNotEmpty) {
      requestData['notes'] = notes;
    }

    final response = await _handleRequest<Map<String, dynamic>>(
      () => _dio.put(ApiConstants.equipmentStatus(jobId), data: requestData),
    );

    // Handle nested response structure
    final statusData = response['success'] == true && response['data'] != null
        ? response['data']['status'] ?? response['data']
        : response['status'] ?? response;

    return EquipmentStatus.fromJson(statusData);
  }

  /// Get equipment status history
  /// GET /api/workshop/status/:jobId/history
  Future<List<EquipmentStatusHistory>> getEquipmentStatusHistory(
    String jobId,
  ) async {
    final response = await _handleRequest<Map<String, dynamic>>(
      () => _dio.get(ApiConstants.equipmentStatusHistory(jobId)),
    );

    // Handle nested response structure
    final history = response['success'] == true && response['data'] != null
        ? response['data']['history'] ?? response['data']
        : response['history'] ?? response['data'] ?? [];

    return (history as List)
        .map((item) => EquipmentStatusHistory.fromJson(item))
        .toList();
  }

  // ==================== Customer API Methods ====================

  /// Get customer's workshop jobs
  /// GET /api/workshop/customer/:customerId/jobs
  Future<List<WorkOrder>> getCustomerWorkshopJobs(String customerId) async {
    final data = await _handleRequest<Map<String, dynamic>>(
      () => _dio.get(ApiConstants.customerWorkshopJobs(customerId)),
    );

    final jobs = data['jobs'] ?? data['data'] ?? [];
    return (jobs as List).map((job) => WorkOrder.fromJson(job)).toList();
  }

  // ==================== Technician API Methods ====================

  /// Update technician availability status
  /// PATCH /api/technicians/:id/availability
  Future<User> updateTechnicianAvailability(
    String technicianId,
    bool isAvailable,
  ) async {
    final data = await _handleRequest<Map<String, dynamic>>(
      () => _dio.patch(
        ApiConstants.technicianAvailability(technicianId),
        data: {'is_available': isAvailable},
      ),
    );

    final user = User.fromJson(data['technician'] ?? data['user'] ?? data);
    await _storage.saveUser(user);

    return user;
  }
}
