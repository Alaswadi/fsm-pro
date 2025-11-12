import 'user.dart';
import 'work_order.dart';

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;
  final String? message;

  const ApiResponse({
    required this.success,
    this.data,
    this.error,
    this.message,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] ?? false,
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : null,
      error: json['error'],
      message: json['message'],
    );
  }

  Map<String, dynamic> toJson(Object? Function(T)? toJsonT) {
    return {
      'success': success,
      if (data != null && toJsonT != null) 'data': toJsonT(data as T),
      if (error != null) 'error': error,
      if (message != null) 'message': message,
    };
  }

  factory ApiResponse.success(T data, {String? message}) {
    return ApiResponse<T>(success: true, data: data, message: message);
  }

  factory ApiResponse.failure(String error) {
    return ApiResponse<T>(success: false, error: error);
  }
}

class AuthResponse {
  final String token;
  final User user;

  const AuthResponse({required this.token, required this.user});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'] ?? '',
      user: User.fromJson(json['user'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {'token': token, 'user': user.toJson()};
  }
}

class WorkOrderListResponse {
  final List<WorkOrder> jobs;
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  const WorkOrderListResponse({
    required this.jobs,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  factory WorkOrderListResponse.fromJson(Map<String, dynamic> json) {
    // Extract pagination info from nested pagination object or flat fields
    final pagination = json['pagination'] as Map<String, dynamic>?;
    final total = pagination?['total'] ?? json['total'] ?? 0;
    final page = pagination?['page'] ?? json['page'] ?? 1;
    final limit = pagination?['limit'] ?? json['limit'] ?? 10;
    final totalPages =
        pagination?['totalPages'] ??
        pagination?['total_pages'] ??
        json['totalPages'] ??
        json['total_pages'] ??
        0;

    return WorkOrderListResponse(
      jobs: json['jobs'] != null
          ? (json['jobs'] as List).map((j) => WorkOrder.fromJson(j)).toList()
          : json['data'] != null
          ? (json['data'] as List).map((j) => WorkOrder.fromJson(j)).toList()
          : [],
      total: total,
      page: page,
      limit: limit,
      totalPages: totalPages,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'jobs': jobs.map((j) => j.toJson()).toList(),
      'total': total,
      'page': page,
      'limit': limit,
      'totalPages': totalPages,
    };
  }
}
