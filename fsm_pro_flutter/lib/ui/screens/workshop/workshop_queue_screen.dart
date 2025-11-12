import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../data/models/work_order.dart';
import '../../../providers/workshop_provider.dart';
import '../../widgets/common/error_view.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/work_order/status_badge.dart';
import '../work_orders/work_order_details_screen.dart';

/// Workshop queue screen showing list of workshop jobs
/// Allows technicians to view and claim workshop jobs
class WorkshopQueueScreen extends StatefulWidget {
  const WorkshopQueueScreen({super.key});

  @override
  State<WorkshopQueueScreen> createState() => _WorkshopQueueScreenState();
}

class _WorkshopQueueScreenState extends State<WorkshopQueueScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch workshop queue on screen load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WorkshopProvider>().fetchWorkshopQueue();
    });
  }

  Future<void> _handleRefresh() async {
    await context.read<WorkshopProvider>().refresh();
  }

  Future<void> _handleClaimJob(String jobId) async {
    final provider = context.read<WorkshopProvider>();
    final success = await provider.claimJob(jobId);

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Job claimed successfully'),
          backgroundColor: AppColors.success,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.error ?? 'Failed to claim job'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _navigateToJobDetails(WorkOrder job) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => WorkOrderDetailsScreen(workOrderId: job.id),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Workshop Queue'), elevation: 0),
      body: Consumer<WorkshopProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.workshopQueue.isEmpty) {
            return const LoadingIndicator();
          }

          if (provider.error != null && provider.workshopQueue.isEmpty) {
            return ErrorView(
              message: provider.error!,
              onRetry: () => provider.fetchWorkshopQueue(),
            );
          }

          if (provider.workshopQueue.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.home_repair_service_outlined,
                    size: 64,
                    color: AppColors.textSecondary.withValues(alpha: 0.5),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'No workshop jobs',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Workshop jobs will appear here',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _handleRefresh,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: provider.workshopQueue.length,
              itemBuilder: (context, index) {
                final job = provider.workshopQueue[index];
                return WorkshopJobCard(
                  job: job,
                  onTap: () => _navigateToJobDetails(job),
                  onClaim: job.technicianId == null
                      ? () => _handleClaimJob(job.id)
                      : null,
                );
              },
            ),
          );
        },
      ),
    );
  }
}

/// Card widget for displaying workshop job in queue
class WorkshopJobCard extends StatelessWidget {
  final WorkOrder job;
  final VoidCallback onTap;
  final VoidCallback? onClaim;

  const WorkshopJobCard({
    super.key,
    required this.job,
    required this.onTap,
    this.onClaim,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border, width: 1),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border(
              left: BorderSide(color: _getPriorityColor(), width: 4),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Job number and priority row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Row(
                        children: [
                          const Icon(
                            Icons.home_repair_service,
                            size: 16,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              'Job #${job.id}',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textSecondary,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    PriorityBadge(priority: job.priority, isCompact: true),
                  ],
                ),
                const SizedBox(height: 12),
                // Title
                Text(
                  job.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                // Equipment info
                if (job.equipmentInfo != null) ...[
                  Row(
                    children: [
                      const Icon(
                        Icons.build_outlined,
                        size: 16,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          job.equipmentInfo!,
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
                // Customer name
                if (job.customerName != null) ...[
                  Row(
                    children: [
                      const Icon(
                        Icons.person_outline,
                        size: 16,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          job.customerName!,
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
                // Scheduled date
                Row(
                  children: [
                    const Icon(
                      Icons.access_time,
                      size: 16,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        DateFormatter.formatDateTime(job.scheduledDate),
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                // Equipment status badge
                if (job.equipmentStatus != null) ...[
                  const SizedBox(height: 12),
                  _EquipmentStatusBadge(
                    status: job.equipmentStatus!.currentStatus,
                  ),
                ],
                // Claim button for unassigned jobs
                if (onClaim != null) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: onClaim,
                      icon: const Icon(Icons.check_circle_outline, size: 18),
                      label: const Text('Claim Job'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ],
                // Assigned technician indicator
                if (job.technicianId != null && job.technicianName != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.info.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.person,
                          size: 16,
                          color: AppColors.info,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Assigned to ${job.technicianName}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.info,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _getPriorityColor() {
    switch (job.priority) {
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
}

/// Badge widget for displaying equipment status
class _EquipmentStatusBadge extends StatelessWidget {
  final dynamic status;

  const _EquipmentStatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
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
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: _getStatusColor(),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    final statusStr = status.toString().split('.').last;
    switch (statusStr) {
      case 'pendingIntake':
        return AppColors.equipmentPending;
      case 'inTransit':
        return AppColors.equipmentInTransit;
      case 'received':
        return AppColors.equipmentReceived;
      case 'inRepair':
        return AppColors.equipmentInRepair;
      case 'repairCompleted':
        return AppColors.equipmentCompleted;
      case 'readyForPickup':
      case 'outForDelivery':
        return AppColors.equipmentReady;
      case 'returned':
        return AppColors.success;
      default:
        return AppColors.textSecondary;
    }
  }

  String _getStatusText() {
    final statusStr = status.toString().split('.').last;
    switch (statusStr) {
      case 'pendingIntake':
        return 'Pending Intake';
      case 'inTransit':
        return 'In Transit';
      case 'received':
        return 'Received';
      case 'inRepair':
        return 'In Repair';
      case 'repairCompleted':
        return 'Repair Completed';
      case 'readyForPickup':
        return 'Ready for Pickup';
      case 'outForDelivery':
        return 'Out for Delivery';
      case 'returned':
        return 'Returned';
      default:
        return statusStr;
    }
  }
}
