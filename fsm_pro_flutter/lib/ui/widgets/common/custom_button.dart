import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

enum ButtonStyle { primary, secondary }

/// Reusable button widget with loading state and style variants
class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final ButtonStyle style;
  final bool isFullWidth;
  final IconData? icon;

  const CustomButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.style = ButtonStyle.primary,
    this.isFullWidth = true,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final bool isDisabled = onPressed == null || isLoading;

    return SizedBox(
      width: isFullWidth ? double.infinity : null,
      height: 48,
      child: ElevatedButton(
        onPressed: isDisabled ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: _getBackgroundColor(isDisabled),
          foregroundColor: _getForegroundColor(),
          disabledBackgroundColor: _getDisabledBackgroundColor(),
          disabledForegroundColor: _getDisabledForegroundColor(),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: style == ButtonStyle.secondary
                ? BorderSide(
                    color: isDisabled ? AppColors.border : AppColors.primary,
                    width: 1,
                  )
                : BorderSide.none,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        ),
        child: isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 20),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    text,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Color _getBackgroundColor(bool isDisabled) {
    if (isDisabled) return _getDisabledBackgroundColor();
    return style == ButtonStyle.primary
        ? AppColors.primary
        : Colors.transparent;
  }

  Color _getForegroundColor() {
    return style == ButtonStyle.primary ? Colors.white : AppColors.primary;
  }

  Color _getDisabledBackgroundColor() {
    return style == ButtonStyle.primary ? AppColors.border : Colors.transparent;
  }

  Color _getDisabledForegroundColor() {
    return AppColors.textSecondary;
  }
}
