import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import 'custom_button.dart' as custom;

enum ErrorType { network, auth, generic }

/// Reusable error display widget with retry functionality
class ErrorView extends StatelessWidget {
  final String message;
  final ErrorType errorType;
  final VoidCallback? onRetry;
  final String? retryButtonText;

  const ErrorView({
    super.key,
    required this.message,
    this.errorType = ErrorType.generic,
    this.onRetry,
    this.retryButtonText,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(_getErrorIcon(), size: 64, color: _getErrorColor()),
            const SizedBox(height: 16),
            Text(
              _getErrorTitle(),
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              custom.CustomButton(
                text: retryButtonText ?? 'Retry',
                onPressed: onRetry,
                isFullWidth: false,
                icon: Icons.refresh,
              ),
            ],
          ],
        ),
      ),
    );
  }

  IconData _getErrorIcon() {
    switch (errorType) {
      case ErrorType.network:
        return Icons.wifi_off;
      case ErrorType.auth:
        return Icons.lock_outline;
      case ErrorType.generic:
        return Icons.error_outline;
    }
  }

  Color _getErrorColor() {
    switch (errorType) {
      case ErrorType.network:
        return AppColors.warning;
      case ErrorType.auth:
        return AppColors.error;
      case ErrorType.generic:
        return AppColors.textSecondary;
    }
  }

  String _getErrorTitle() {
    switch (errorType) {
      case ErrorType.network:
        return 'Connection Error';
      case ErrorType.auth:
        return 'Authentication Error';
      case ErrorType.generic:
        return 'Something Went Wrong';
    }
  }
}

/// Compact error message widget for inline display
class ErrorMessage extends StatelessWidget {
  final String message;
  final VoidCallback? onDismiss;

  const ErrorMessage({super.key, required this.message, this.onDismiss});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.error.withOpacity(0.3), width: 1),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.error, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(fontSize: 14, color: AppColors.error),
            ),
          ),
          if (onDismiss != null) ...[
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.close, size: 20, color: AppColors.error),
              onPressed: onDismiss,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ],
        ],
      ),
    );
  }
}
