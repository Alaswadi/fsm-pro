import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../data/models/equipment_status.dart';
import '../../../providers/workshop_provider.dart';
import '../common/loading_indicator.dart';

/// Component for tracking equipment status in workshop jobs
/// Displays current status, allows status transitions, and shows history
class EquipmentTrackingComponent extends StatefulWidget {
  final String jobId;

  const EquipmentTrackingComponent({super.key, required this.jobId});

  @override
  State<EquipmentTrackingComponent> createState() =>
      _EquipmentTrackingComponentState();
}

class _EquipmentTrackingComponentState
    extends State<EquipmentTrackingComponent> {
  final TextEditingController _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Fetch equipment status on component load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WorkshopProvider>().fetchEquipmentStatus(widget.jobId);
    });
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleStatusUpdate(EquipmentRepairStatus newStatus) async {
    // Show notes dialog
    final notes = await _showNotesDialog(newStatus);
    if (notes == null) return; // User cancelled

    if (!mounted) return;

    final provider = context.read<WorkshopProvider>();
    final success = await provider.updateEquipmentStatus(
      widget.jobId,
      newStatus.toApiString(),
      notes: notes.isEmpty ? null : notes,
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Equipment status updated successfully'),
          backgroundColor: AppColors.success,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.error ?? 'Failed to update status'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<String?> _showNotesDialog(EquipmentRepairStatus newStatus) async {
    _notesController.clear();
    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Update to ${_getStatusDisplayText(newStatus)}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Add optional notes about this status change:',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              decoration: const InputDecoration(
                hintText: 'Enter notes (optional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, _notesController.text),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('Update Status'),
          ),
        ],
      ),
    );
  }

  String _getStatusDisplayText(EquipmentRepairStatus status) {
    switch (status) {
      case EquipmentRepairStatus.pendingIntake:
        return 'Pending Intake';
      case EquipmentRepairStatus.inTransit:
        return 'In Transit';
      case EquipmentRepairStatus.received:
        return 'Received';
      case EquipmentRepairStatus.inRepair:
        return 'In Repair';
      case EquipmentRepairStatus.repairCompleted:
        return 'Repair Completed';
      case EquipmentRepairStatus.readyForPickup:
        return 'Ready for Pickup';
      case EquipmentRepairStatus.outForDelivery:
        return 'Out for Delivery';
      case EquipmentRepairStatus.returned:
        return 'Returned';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<WorkshopProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading && provider.currentEquipmentStatus == null) {
          return const LoadingIndicator();
        }

        final equipmentStatus = provider.currentEquipmentStatus;
        if (equipmentStatus == null) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(16.0),
              child: Text(
                'No equipment tracking available for this job',
                style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
              ),
            ),
          );
        }

        final nextStatuses = provider.getNextStatuses(
          equipmentStatus.currentStatus,
        );

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Current Status Card
            _CurrentStatusCard(
              status: equipmentStatus.currentStatus,
              timestamp: _getStatusTimestamp(equipmentStatus),
            ),
            const SizedBox(height: 16),

            // Status Transition Buttons
            if (nextStatuses.isNotEmpty) ...[
              const Text(
                'Update Status',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              ...nextStatuses.map(
                (status) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: provider.isLoading
                          ? null
                          : () => _handleStatusUpdate(status),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _getStatusColor(status),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: Text(
                        'Mark as ${_getStatusDisplayText(status)}',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Status History
            if (provider.statusHistory.isNotEmpty) ...[
              const Text(
                'Status History',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              _StatusHistoryTimeline(history: provider.statusHistory),
            ],
          ],
        );
      },
    );
  }

  DateTime? _getStatusTimestamp(EquipmentStatus status) {
    switch (status.currentStatus) {
      case EquipmentRepairStatus.pendingIntake:
        return status.pendingIntakeAt;
      case EquipmentRepairStatus.inTransit:
        return status.inTransitAt;
      case EquipmentRepairStatus.received:
        return status.receivedAt;
      case EquipmentRepairStatus.inRepair:
        return status.inRepairAt;
      case EquipmentRepairStatus.repairCompleted:
        return status.repairCompletedAt;
      case EquipmentRepairStatus.readyForPickup:
        return status.readyForPickupAt;
      case EquipmentRepairStatus.outForDelivery:
        return status.outForDeliveryAt;
      case EquipmentRepairStatus.returned:
        return status.returnedAt;
    }
  }

  Color _getStatusColor(EquipmentRepairStatus status) {
    switch (status) {
      case EquipmentRepairStatus.pendingIntake:
        return AppColors.equipmentPending;
      case EquipmentRepairStatus.inTransit:
        return AppColors.equipmentInTransit;
      case EquipmentRepairStatus.received:
        return AppColors.equipmentReceived;
      case EquipmentRepairStatus.inRepair:
        return AppColors.equipmentInRepair;
      case EquipmentRepairStatus.repairCompleted:
        return AppColors.equipmentCompleted;
      case EquipmentRepairStatus.readyForPickup:
      case EquipmentRepairStatus.outForDelivery:
        return AppColors.equipmentReady;
      case EquipmentRepairStatus.returned:
        return AppColors.success;
    }
  }
}

/// Card displaying current equipment status
class _CurrentStatusCard extends StatelessWidget {
  final EquipmentRepairStatus status;
  final DateTime? timestamp;

  const _CurrentStatusCard({required this.status, this.timestamp});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _getStatusColor().withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _getStatusColor().withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _getStatusColor(),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(_getStatusIcon(), color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Current Status',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _getStatusText(),
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: _getStatusColor(),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (timestamp != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(
                  Icons.access_time,
                  size: 14,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    DateFormatter.formatDateTime(timestamp!),
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Color _getStatusColor() {
    switch (status) {
      case EquipmentRepairStatus.pendingIntake:
        return AppColors.equipmentPending;
      case EquipmentRepairStatus.inTransit:
        return AppColors.equipmentInTransit;
      case EquipmentRepairStatus.received:
        return AppColors.equipmentReceived;
      case EquipmentRepairStatus.inRepair:
        return AppColors.equipmentInRepair;
      case EquipmentRepairStatus.repairCompleted:
        return AppColors.equipmentCompleted;
      case EquipmentRepairStatus.readyForPickup:
      case EquipmentRepairStatus.outForDelivery:
        return AppColors.equipmentReady;
      case EquipmentRepairStatus.returned:
        return AppColors.success;
    }
  }

  String _getStatusText() {
    switch (status) {
      case EquipmentRepairStatus.pendingIntake:
        return 'Pending Intake';
      case EquipmentRepairStatus.inTransit:
        return 'In Transit';
      case EquipmentRepairStatus.received:
        return 'Received';
      case EquipmentRepairStatus.inRepair:
        return 'In Repair';
      case EquipmentRepairStatus.repairCompleted:
        return 'Repair Completed';
      case EquipmentRepairStatus.readyForPickup:
        return 'Ready for Pickup';
      case EquipmentRepairStatus.outForDelivery:
        return 'Out for Delivery';
      case EquipmentRepairStatus.returned:
        return 'Returned';
    }
  }

  IconData _getStatusIcon() {
    switch (status) {
      case EquipmentRepairStatus.pendingIntake:
        return Icons.schedule;
      case EquipmentRepairStatus.inTransit:
        return Icons.local_shipping;
      case EquipmentRepairStatus.received:
        return Icons.inventory_2;
      case EquipmentRepairStatus.inRepair:
        return Icons.build;
      case EquipmentRepairStatus.repairCompleted:
        return Icons.check_circle;
      case EquipmentRepairStatus.readyForPickup:
        return Icons.shopping_bag;
      case EquipmentRepairStatus.outForDelivery:
        return Icons.delivery_dining;
      case EquipmentRepairStatus.returned:
        return Icons.done_all;
    }
  }
}

/// Timeline widget showing equipment status history
class _StatusHistoryTimeline extends StatelessWidget {
  final List<EquipmentStatusHistory> history;

  const _StatusHistoryTimeline({required this.history});

  @override
  Widget build(BuildContext context) {
    // Sort history by timestamp descending (most recent first)
    final sortedHistory = List<EquipmentStatusHistory>.from(history)
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: sortedHistory.length,
      itemBuilder: (context, index) {
        final item = sortedHistory[index];
        final isLast = index == sortedHistory.length - 1;

        return _StatusHistoryItem(history: item, isLast: isLast);
      },
    );
  }
}

/// Individual item in status history timeline
class _StatusHistoryItem extends StatelessWidget {
  final EquipmentStatusHistory history;
  final bool isLast;

  const _StatusHistoryItem({required this.history, required this.isLast});

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator
          Column(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: _getStatusColor(),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
              if (!isLast)
                Expanded(child: Container(width: 2, color: AppColors.border)),
            ],
          ),
          const SizedBox(width: 12),
          // Content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _getStatusText(),
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    DateFormatter.formatDateTime(history.timestamp),
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  if (history.notes != null && history.notes!.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.inputBackground,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        history.notes!,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    switch (history.status) {
      case EquipmentRepairStatus.pendingIntake:
        return AppColors.equipmentPending;
      case EquipmentRepairStatus.inTransit:
        return AppColors.equipmentInTransit;
      case EquipmentRepairStatus.received:
        return AppColors.equipmentReceived;
      case EquipmentRepairStatus.inRepair:
        return AppColors.equipmentInRepair;
      case EquipmentRepairStatus.repairCompleted:
        return AppColors.equipmentCompleted;
      case EquipmentRepairStatus.readyForPickup:
      case EquipmentRepairStatus.outForDelivery:
        return AppColors.equipmentReady;
      case EquipmentRepairStatus.returned:
        return AppColors.success;
    }
  }

  String _getStatusText() {
    switch (history.status) {
      case EquipmentRepairStatus.pendingIntake:
        return 'Pending Intake';
      case EquipmentRepairStatus.inTransit:
        return 'In Transit';
      case EquipmentRepairStatus.received:
        return 'Received';
      case EquipmentRepairStatus.inRepair:
        return 'In Repair';
      case EquipmentRepairStatus.repairCompleted:
        return 'Repair Completed';
      case EquipmentRepairStatus.readyForPickup:
        return 'Ready for Pickup';
      case EquipmentRepairStatus.outForDelivery:
        return 'Out for Delivery';
      case EquipmentRepairStatus.returned:
        return 'Returned';
    }
  }
}
