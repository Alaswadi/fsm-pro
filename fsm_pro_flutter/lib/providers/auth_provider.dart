import 'package:flutter/foundation.dart';
import '../data/models/user.dart';
import '../data/repositories/auth_repository.dart';
import '../data/services/storage_service.dart';

/// Provider for authentication state management.
/// Manages user authentication, login/logout operations, and auth state persistence.
class AuthProvider extends ChangeNotifier {
  final AuthRepository _authRepository;
  final StorageService _storageService;

  User? _currentUser;
  bool _isLoading = false;
  String? _error;

  AuthProvider({
    required AuthRepository authRepository,
    required StorageService storageService,
  }) : _authRepository = authRepository,
       _storageService = storageService;

  // ==================== Getters ====================

  /// Current authenticated user
  User? get currentUser => _currentUser;

  /// Loading state
  bool get isLoading => _isLoading;

  /// Error message
  String? get error => _error;

  /// Check if user is authenticated
  bool get isAuthenticated => _currentUser != null;

  // ==================== Public Methods ====================

  /// Login with email and password
  /// Returns true if login is successful, false otherwise
  Future<bool> login(String email, String password) async {
    debugPrint('👤 AuthProvider: Starting login for $email');
    _setLoading(true);
    _clearError();

    final result = await _authRepository.login(email, password);

    if (result.isSuccess && result.data != null) {
      debugPrint('✅ AuthProvider: Login successful');
      _currentUser = result.data;
      _setLoading(false);
      notifyListeners();
      return true;
    } else {
      debugPrint('❌ AuthProvider: Login failed - ${result.error}');
      _setError(result.error ?? 'Login failed');
      _setLoading(false);
      return false;
    }
  }

  /// Logout current user
  /// Clears storage and resets state
  Future<void> logout() async {
    _setLoading(true);
    _clearError();

    // Call repository logout (even if it fails, we clear local state)
    await _authRepository.logout();

    // Clear storage
    await _storageService.clearAuth();

    // Clear state
    _currentUser = null;
    _setLoading(false);
    notifyListeners();
  }

  /// Check authentication status on app start
  /// Loads user from storage if token exists
  /// Returns true if authenticated, false otherwise
  Future<bool> checkAuthStatus() async {
    _setLoading(true);
    _clearError();

    try {
      // Check if token exists in storage
      final hasToken = await _storageService.hasToken();

      if (!hasToken) {
        _setLoading(false);
        return false;
      }

      // Try to load user from storage
      final storedUser = await _storageService.getUser();

      if (storedUser != null) {
        // Verify token is still valid by fetching profile
        final result = await _authRepository.getProfile();

        if (result.isSuccess && result.data != null) {
          _currentUser = result.data;
          // Update stored user with fresh data
          await _storageService.saveUser(result.data!);
          _setLoading(false);
          notifyListeners();
          return true;
        } else {
          // Token is invalid, clear auth
          await _storageService.clearAuth();
          _setLoading(false);
          return false;
        }
      } else {
        // No stored user, clear auth
        await _storageService.clearAuth();
        _setLoading(false);
        return false;
      }
    } catch (e) {
      _setError('Failed to check authentication status');
      await _storageService.clearAuth();
      _setLoading(false);
      return false;
    }
  }

  /// Update technician availability status
  /// Returns true if update is successful, false otherwise
  Future<bool> updateAvailability(bool isAvailable) async {
    if (_currentUser == null || _currentUser!.technicianId == null) {
      _setError('User is not a technician');
      return false;
    }

    _setLoading(true);
    _clearError();

    final result = await _authRepository.updateAvailability(
      _currentUser!.technicianId!,
      isAvailable,
    );

    if (result.isSuccess && result.data != null) {
      _currentUser = result.data;
      _setLoading(false);
      notifyListeners();
      return true;
    } else {
      _setError(result.error ?? 'Failed to update availability');
      _setLoading(false);
      return false;
    }
  }

  /// Clear error message
  void clearError() {
    _clearError();
    notifyListeners();
  }

  // ==================== Private Methods ====================

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
  }
}
