import 'package:flutter/foundation.dart';
import '../../core/errors/exceptions.dart';
import '../../core/utils/result.dart';
import '../models/user.dart';
import '../services/api_service.dart';

/// Repository for authentication operations.
/// Wraps ApiService auth methods with Result pattern and provides
/// user-friendly error messages.
class AuthRepository {
  final ApiService _apiService;

  AuthRepository(this._apiService);

  /// Login with email and password
  /// Returns Result with User on success or error message on failure
  Future<Result<User>> login(String email, String password) async {
    try {
      debugPrint('📦 AuthRepository: Validating login inputs');
      // Validate inputs
      if (email.isEmpty || password.isEmpty) {
        debugPrint('❌ AuthRepository: Empty email or password');
        return Result.error('Email and password are required');
      }

      debugPrint('📦 AuthRepository: Calling API service login');
      final authResponse = await _apiService.login(email, password);
      debugPrint('✅ AuthRepository: Login successful');
      return Result.success(authResponse.user);
    } on AuthException catch (e) {
      debugPrint('❌ AuthRepository: AuthException - ${e.message}');
      return Result.error(e.message);
    } on NetworkException catch (e) {
      debugPrint('❌ AuthRepository: NetworkException - ${e.message}');
      return Result.error(e.message);
    } on AppException catch (e) {
      debugPrint('❌ AuthRepository: AppException - ${e.message}');
      return Result.error(e.message);
    } catch (e) {
      debugPrint('❌ AuthRepository: Unexpected error - $e');
      return Result.error('Login failed. Please try again.');
    }
  }

  /// Logout current user
  /// Returns Result with void on success or error message on failure
  Future<Result<void>> logout() async {
    try {
      await _apiService.logout();
      return Result.success(null);
    } on NetworkException {
      // Even if network fails, we should clear local auth
      return Result.success(null);
    } on AppException catch (e) {
      return Result.error(e.message);
    } catch (e) {
      // Even if logout fails, we should clear local auth
      return Result.success(null);
    }
  }

  /// Get current user profile
  /// Returns Result with User on success or error message on failure
  Future<Result<User>> getProfile() async {
    try {
      final user = await _apiService.getProfile();
      return Result.success(user);
    } on AuthException {
      return Result.error('Session expired. Please login again.');
    } on NetworkException catch (e) {
      return Result.error(e.message);
    } on AppException catch (e) {
      return Result.error(e.message);
    } catch (e) {
      return Result.error('Failed to load profile. Please try again.');
    }
  }

  /// Update technician availability status
  /// Returns Result with updated User on success or error message on failure
  Future<Result<User>> updateAvailability(
    String technicianId,
    bool isAvailable,
  ) async {
    try {
      final user = await _apiService.updateTechnicianAvailability(
        technicianId,
        isAvailable,
      );
      return Result.success(user);
    } on AuthException {
      return Result.error('Session expired. Please login again.');
    } on NetworkException catch (e) {
      return Result.error(e.message);
    } on AppException catch (e) {
      return Result.error(e.message);
    } catch (e) {
      return Result.error('Failed to update availability. Please try again.');
    }
  }
}
