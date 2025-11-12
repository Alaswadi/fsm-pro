import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/models/work_order.dart';

/// Colored badge widget for displaying work order status
class StatusBadge extends StatelessWidget {
  final WorkOrderStatus status;
  final bool isCompact;

  const StatusBadge({super.key, required this.status, this.isCompact = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isCompact ? 8 : 12,
        vertical: isCompact ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: _getStatusColor().withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _getStatusColor().withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: _getStatusColor(),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            _getStatusText(),
            style: TextStyle(
              fontSize: isCompact ? 11 : 12,
              fontWeight: FontWeight.w600,
              color: _getStatusColor(),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    switch (status) {
      case WorkOrderStatus.scheduled:
        return AppColors.statusScheduled;
      case WorkOrderStatus.assigned:
        return AppColors.statusScheduled; // Same as scheduled
      case WorkOrderStatus.inProgress:
        return AppColors.statusInProgress;
      case WorkOrderStatus.completed:
        return AppColors.statusCompleted;
      case WorkOrderStatus.cancelled:
        return AppColors.statusCancelled;
    }
  }

  String _getStatusText() {
    switch (status) {
      case WorkOrderStatus.scheduled:
        return 'Scheduled';
      case WorkOrderStatus.assigned:
        return 'Assigned';
      case WorkOrderStatus.inProgress:
        return 'In Progress';
      case WorkOrderStatus.completed:
        return 'Completed';
      case WorkOrderStatus.cancelled:
        return 'Cancelled';
    }
  }
}

/// Priority badge widget for displaying work order priority
class PriorityBadge extends StatelessWidget {
  final WorkOrderPriority priority;
  final bool isCompact;

  const PriorityBadge({
    super.key,
    required this.priority,
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isCompact ? 8 : 12,
        vertical: isCompact ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: _getPriorityColor().withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _getPriorityColor().withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getPriorityIcon(),
            size: isCompact ? 12 : 14,
            color: _getPriorityColor(),
          ),
          const SizedBox(width: 4),
          Text(
            _getPriorityText(),
            style: TextStyle(
              fontSize: isCompact ? 11 : 12,
              fontWeight: FontWeight.w600,
              color: _getPriorityColor(),
            ),
          ),
        ],
      ),
    );
  }

  Color _getPriorityColor() {
    switch (priority) {
      case WorkOrderPriority.low:
        return AppColors.priorityLow;
      case WorkOrderPriority.medium:
        return AppColors.priorityMedium;
      case WorkOrderPriority.high:
        return AppColors.priorityHigh;
      case WorkOrderPriority.urgent:
        return AppColors.priorityUrgent;
    }
  }

  String _getPriorityText() {
    switch (priority) {
      case WorkOrderPriority.low:
        return 'Low';
      case WorkOrderPriority.medium:
        return 'Medium';
      case WorkOrderPriority.high:
        return 'High';
      case WorkOrderPriority.urgent:
        return 'Urgent';
    }
  }

  IconData _getPriorityIcon() {
    switch (priority) {
      case WorkOrderPriority.low:
        return Icons.arrow_downward;
      case WorkOrderPriority.medium:
        return Icons.remove;
      case WorkOrderPriority.high:
        return Icons.arrow_upward;
      case WorkOrderPriority.urgent:
        return Icons.priority_high;
    }
  }
}
