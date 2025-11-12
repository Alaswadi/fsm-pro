import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/constants/app_strings.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'ui/navigation/app_router.dart';
import 'ui/screens/auth/login_screen.dart';
import 'ui/navigation/home_screen.dart';

/// Root application widget.
/// Handles app initialization, authentication checking, and routing.
class FSMProApp extends StatelessWidget {
  const FSMProApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppStrings.appName,
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: const AppInitializer(),
      onGenerateRoute: (settings) {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        return AppRouter.generateRoute(settings, authProvider);
      },
    );
  }
}

/// Widget that handles app initialization and authentication checking.
/// Shows a splash screen while checking auth status, then navigates to
/// either login or home screen based on authentication state.
class AppInitializer extends StatefulWidget {
  const AppInitializer({super.key});

  @override
  State<AppInitializer> createState() => _AppInitializerState();
}

class _AppInitializerState extends State<AppInitializer> {
  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
  }

  /// Check authentication status on app start.
  /// Navigates to home if authenticated, login if not.
  Future<void> _checkAuthStatus() async {
    // Get auth provider
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    // Small delay to show splash screen
    await Future.delayed(const Duration(milliseconds: 500));

    // Check if user is already authenticated
    final isAuthenticated = await authProvider.checkAuthStatus();

    // Navigate based on authentication status
    if (mounted) {
      if (isAuthenticated) {
        // User is authenticated, go to home
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const HomeScreen()),
        );
      } else {
        // User is not authenticated, go to login
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Show splash screen while checking authentication
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // App icon
            Icon(
              Icons.build_circle,
              size: 80,
              color: AppTheme.lightTheme.colorScheme.primary,
            ),
            const SizedBox(height: 24),
            // App name
            const Text(
              AppStrings.appName,
              style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            // Tagline
            const Text(
              'Field Service Management',
              style: TextStyle(fontSize: 16, color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 48),
            // Loading indicator
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(
                AppTheme.lightTheme.colorScheme.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
