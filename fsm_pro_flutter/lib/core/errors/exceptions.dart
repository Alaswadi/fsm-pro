/// Base exception class for app errors
class AppException implements Exception {
  final String message;
  final String? code;

  AppException(this.message, [this.code]);

  @override
  String toString() => message;
}

/// Exception for network-related errors
class NetworkException extends AppException {
  NetworkException(String message) : super(message, 'NETWORK_ERROR');
}

/// Exception for authentication errors
class AuthException extends AppException {
  AuthException(String message) : super(message, 'AUTH_ERROR');
}

/// Exception for API errors
class ApiException extends AppException {
  final int? statusCode;

  ApiException(super.message, [this.statusCode, super.code]);
}

/// Exception for validation errors
class ValidationException extends AppException {
  ValidationException(String message) : super(message, 'VALIDATION_ERROR');
}
