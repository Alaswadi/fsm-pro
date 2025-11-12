import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';

/// Service for managing local storage of authentication data and user information.
/// Uses FlutterSecureStorage for sensitive data (auth tokens) and SharedPreferences
/// for non-sensitive data (user information).
class StorageService {
  final FlutterSecureStorage _secureStorage;
  final SharedPreferences _prefs;

  // Storage keys
  static const String _keyAuthToken = 'auth_token';
  static const String _keyUserData = 'user_data';
  static const String _keyUserId = 'user_id';

  StorageService({
    FlutterSecureStorage? secureStorage,
    required SharedPreferences prefs,
  }) : _secureStorage = secureStorage ?? const FlutterSecureStorage(),
       _prefs = prefs;

  /// Factory method to create StorageService instance
  static Future<StorageService> create({
    FlutterSecureStorage? secureStorage,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    return StorageService(secureStorage: secureStorage, prefs: prefs);
  }

  // ==================== Auth Token Methods ====================

  /// Store authentication token securely
  /// Uses FlutterSecureStorage for secure storage
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: _keyAuthToken, value: token);
  }

  /// Retrieve authentication token
  /// Returns null if no token is stored
  Future<String?> getToken() async {
    return await _secureStorage.read(key: _keyAuthToken);
  }

  /// Check if authentication token exists
  Future<bool> hasToken() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  // ==================== User Data Methods ====================

  /// Store user data
  /// Converts User object to JSON and stores in SharedPreferences
  Future<void> saveUser(User user) async {
    final userJson = jsonEncode(user.toJson());
    await _prefs.setString(_keyUserData, userJson);
    await _prefs.setString(_keyUserId, user.id);
  }

  /// Retrieve user data
  /// Returns null if no user data is stored or if parsing fails
  Future<User?> getUser() async {
    try {
      final userJson = _prefs.getString(_keyUserData);
      if (userJson == null) return null;

      final userMap = jsonDecode(userJson) as Map<String, dynamic>;
      return User.fromJson(userMap);
    } catch (e) {
      // If parsing fails, return null
      return null;
    }
  }

  /// Get stored user ID
  /// Returns null if no user ID is stored
  Future<String?> getUserId() async {
    return _prefs.getString(_keyUserId);
  }

  /// Check if user data exists
  Future<bool> hasUser() async {
    return _prefs.containsKey(_keyUserData);
  }

  // ==================== Clear Auth Methods ====================

  /// Clear all authentication data
  /// Removes both auth token and user data
  Future<void> clearAuth() async {
    await _secureStorage.delete(key: _keyAuthToken);
    await _prefs.remove(_keyUserData);
    await _prefs.remove(_keyUserId);
  }

  /// Clear all stored data
  /// Use with caution - removes everything from storage
  Future<void> clearAll() async {
    await _secureStorage.deleteAll();
    await _prefs.clear();
  }
}
