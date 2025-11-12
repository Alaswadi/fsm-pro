import 'package:dio/dio.dart';

/// Comprehensive API connectivity test script
/// Run with: dart run test_api_connection.dart
void main() async {
  final dio = Dio();
  final baseUrl = 'https://fsmpro.phishsimulator.com/api';

  print('');
  print('═══════════════════════════════════════════════════');
  print('🧪 FSM Pro API Connection Test');
  print('═══════════════════════════════════════════════════');
  print('📍 Target: $baseUrl');
  print('⏱️  Timeout: 30 seconds');
  print('═══════════════════════════════════════════════════');
  print('');

  // Configure Dio
  dio.options = BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
    validateStatus: (status) => true,
  );

  try {
    // Test 1: DNS Resolution & Basic Connectivity
    print('Test 1: DNS Resolution & Basic Connectivity');
    print('─────────────────────────────────────────────');
    try {
      final response = await dio.get(
        '/auth/login',
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );
      print('✅ Server is reachable');
      print('   Status Code: ${response.statusCode}');
      print('   Status Message: ${response.statusMessage}');
      print('   Response: ${response.data}');
    } catch (e) {
      print('❌ Server unreachable');
      print('   Error: $e');
      print('');
      print('💡 Troubleshooting:');
      print('   1. Check if the domain is accessible in a browser');
      print('   2. Verify your internet connection');
      print('   3. Check if there\'s a firewall blocking the connection');
      print('   4. Ensure the backend server is running');
      return;
    }
    print('');

    // Test 2: Login Endpoint
    print('Test 2: Login Endpoint');
    print('─────────────────────────────────────────────');
    print('Attempting login with test credentials...');
    final loginResponse = await dio.post(
      '/auth/login',
      data: {
        'email': 'admin@fsmproapi.phishsimulator.com',
        'password': 'Admin@123',
      },
      options: Options(
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    print('   Status Code: ${loginResponse.statusCode}');
    print('   Response: ${loginResponse.data}');

    if (loginResponse.statusCode == 200 || loginResponse.statusCode == 201) {
      print('✅ Login successful!');

      // Extract token
      final token =
          loginResponse.data['token'] ?? loginResponse.data['access_token'];
      if (token != null) {
        print('   Token received: ${token.toString().substring(0, 20)}...');
        print('');

        // Test 3: Authenticated Request - Work Orders
        print('Test 3: Authenticated Request - Work Orders');
        print('─────────────────────────────────────────────');
        final jobsResponse = await dio.get(
          '/jobs',
          options: Options(
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': 'Bearer $token',
            },
          ),
        );

        print('   Status Code: ${jobsResponse.statusCode}');
        print('   Response: ${jobsResponse.data}');

        if (jobsResponse.statusCode == 200) {
          print('✅ Work orders fetched successfully!');

          // Count jobs
          final jobs =
              jobsResponse.data['jobs'] ?? jobsResponse.data['data'] ?? [];
          print('   Total jobs: ${jobs.length}');
        } else {
          print('❌ Failed to fetch work orders');
        }
        print('');

        // Test 4: Profile Endpoint
        print('Test 4: Profile Endpoint');
        print('─────────────────────────────────────────────');
        final profileResponse = await dio.get(
          '/auth/profile',
          options: Options(
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': 'Bearer $token',
            },
          ),
        );

        print('   Status Code: ${profileResponse.statusCode}');
        print('   Response: ${profileResponse.data}');

        if (profileResponse.statusCode == 200) {
          print('✅ Profile fetched successfully!');
        } else {
          print('❌ Failed to fetch profile');
        }
      } else {
        print('⚠️  No token in response');
      }
    } else {
      print('❌ Login failed');
      print('   Expected status: 200 or 201');
      print('   Received status: ${loginResponse.statusCode}');
      print('');
      print('💡 Possible issues:');
      print('   1. Invalid credentials');
      print('   2. API endpoint path mismatch');
      print('   3. Backend authentication logic issue');
    }
  } on DioException catch (e) {
    print('');
    print('❌ Connection Error');
    print('─────────────────────────────────────────────');
    print('   Type: ${e.type}');
    print('   Message: ${e.message}');

    if (e.response != null) {
      print('   Status Code: ${e.response?.statusCode}');
      print('   Response Data: ${e.response?.data}');
    }

    print('');
    print('💡 Error Analysis:');
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
        print('   → Connection timeout - Server took too long to respond');
        print('   → Check if the server is running and accessible');
        break;
      case DioExceptionType.sendTimeout:
        print('   → Send timeout - Request took too long to send');
        break;
      case DioExceptionType.receiveTimeout:
        print('   → Receive timeout - Response took too long');
        break;
      case DioExceptionType.connectionError:
        print('   → Connection error - Cannot reach the server');
        print('   → Verify the URL: $baseUrl');
        print('   → Check your internet connection');
        print('   → Ensure the backend is running');
        break;
      case DioExceptionType.badResponse:
        print('   → Bad response from server');
        print('   → Status: ${e.response?.statusCode}');
        break;
      default:
        print('   → Unknown error type');
    }
  } catch (e) {
    print('');
    print('❌ Unexpected Error');
    print('─────────────────────────────────────────────');
    print('   $e');
  }

  print('');
  print('═══════════════════════════════════════════════════');
  print('✅ Test Complete');
  print('═══════════════════════════════════════════════════');
  print('');
}
