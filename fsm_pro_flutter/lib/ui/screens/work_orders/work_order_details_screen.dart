import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../data/models/equipment_status.dart';
import '../../../data/models/work_order.dart';
import '../../../data/models/inventory_order.dart';
import '../../../providers/work_order_provider.dart';
import '../../../providers/inventory_provider.dart';
import '../../../data/services/api_service.dart';
import '../../widgets/common/error_view.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/work_order/status_badge.dart';
import '../../widgets/inventory/inventory_order_dialog.dart';

/// Screen displaying detailed information about a work order
class WorkOrderDetailsScreen extends StatefulWidget {
  final String workOrderId;

  const WorkOrderDetailsScreen({super.key, required this.workOrderId});

  @override
  State<WorkOrderDetailsScreen> createState() => _WorkOrderDetailsScreenState();
}

class _WorkOrderDetailsScreenState extends State<WorkOrderDetailsScreen> {
  bool _isInitialized = false;
  List<InventoryOrder> _inventoryOrders = [];
  InventoryOrderSummary? _orderSummary;
  bool _isLoadingOrders = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInitialized) {
      _loadWorkOrderDetails();
      _isInitialized = true;
    }
  }

  Future<void> _loadWorkOrderDetails() async {
    await context.read<WorkOrderProvider>().fetchWorkOrderDetails(
      widget.workOrderId,
    );
    // Load inventory orders after work order details are loaded
    await _loadInventoryOrders();
  }

  Future<void> _loadInventoryOrders() async {
    setState(() {
      _isLoadingOrders = true;
    });

    try {
      final apiService = context.read<ApiService>();
      final result = await apiService.getWorkOrderInventoryOrders(
        widget.workOrderId,
      );
      setState(() {
        _inventoryOrders = result.$1;
        _orderSummary = result.$2;
        _isLoadingOrders = false;
      });
    } catch (error) {
      debugPrint('Error loading inventory orders: $error');
      setState(() {
        _inventoryOrders = [];
        _orderSummary = null;
        _isLoadingOrders = false;
      });
    }
  }

  Future<void> _onRefresh() async {
    await _loadWorkOrderDetails();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Work Order Details'),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
      ),
      body: Consumer<WorkOrderProvider>(
        builder: (context, workOrderProvider, child) {
          if (workOrderProvider.isLoading &&
              workOrderProvider.selectedWorkOrder == null) {
            return const LoadingIndicator(
              message: 'Loading work order details...',
            );
          }

          if (workOrderProvider.error != null &&
              workOrderProvider.selectedWorkOrder == null) {
            return ErrorView(
              message: workOrderProvider.error!,
              errorType: ErrorType.network,
              onRetry: _loadWorkOrderDetails,
            );
          }

          final workOrder = workOrderProvider.selectedWorkOrder;
          if (workOrder == null) {
            return const ErrorView(
              message: 'Work order not found',
              errorType: ErrorType.generic,
            );
          }

          return RefreshIndicator(
            onRefresh: _onRefresh,
            color: AppColors.primary,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(workOrder),
                  const SizedBox(height: 16),
                  _buildCustomerInfoCard(workOrder),
                  const SizedBox(height: 16),
                  if (workOrder.equipmentInfo != null) ...[
                    _buildEquipmentInfoCard(workOrder),
                    const SizedBox(height: 16),
                  ],
                  _buildJobDetailsCard(workOrder),
                  if (workOrder.notes != null &&
                      workOrder.notes!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _buildNotesCard(workOrder),
                  ],
                  if (workOrder.locationType == LocationType.workshop &&
                      workOrder.equipmentStatus != null) ...[
                    const SizedBox(height: 16),
                    _buildEquipmentTrackingCard(workOrder),
                  ],
                  if (workOrder.status == WorkOrderStatus.assigned ||
                      workOrder.status == WorkOrderStatus.inProgress) ...[
                    const SizedBox(height: 16),
                    _buildInventoryOrderCard(),
                  ],
                  const SizedBox(height: 80),
                ],
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: Consumer<WorkOrderProvider>(
        builder: (context, workOrderProvider, child) {
          final workOrder = workOrderProvider.selectedWorkOrder;
          if (workOrder == null) return const SizedBox.shrink();

          return _buildActionButtons(workOrder);
        },
      ),
      floatingActionButton: Consumer<WorkOrderProvider>(
        builder: (context, workOrderProvider, child) {
          final workOrder = workOrderProvider.selectedWorkOrder;
          if (workOrder == null) return const SizedBox.shrink();

          // Only show for assigned or in-progress jobs
          if (workOrder.status != WorkOrderStatus.assigned &&
              workOrder.status != WorkOrderStatus.inProgress) {
            return const SizedBox.shrink();
          }

          return FloatingActionButton.extended(
            onPressed: () => _showAddNotesDialog(workOrder),
            backgroundColor: AppColors.primary,
            icon: const Icon(Icons.note_add, color: Colors.white),
            label: const Text(
              'Add Notes',
              style: TextStyle(color: Colors.white),
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(WorkOrder workOrder) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Job #${workOrder.id}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        workOrder.title,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                StatusBadge(status: workOrder.status),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                PriorityBadge(priority: workOrder.priority),
                if (workOrder.locationType == LocationType.workshop) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.info.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.info.withValues(alpha: 0.3),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(
                          Icons.home_repair_service,
                          size: 14,
                          color: AppColors.info,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'Workshop',
                          style: TextStyle(
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
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerInfoCard(WorkOrder workOrder) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.person, size: 20, color: AppColors.primary),
                SizedBox(width: 8),
                Text(
                  'Customer Information',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (workOrder.customerName != null)
              _buildInfoRow(
                Icons.person_outline,
                'Name',
                workOrder.customerName!,
              ),
            // Note: Additional customer details would come from a joined customer object
            // For now, we only have customerName from the work order
          ],
        ),
      ),
    );
  }

  Widget _buildEquipmentInfoCard(WorkOrder workOrder) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.build, size: 20, color: AppColors.primary),
                SizedBox(width: 8),
                Text(
                  'Equipment Information',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildInfoRow(
              Icons.build_outlined,
              'Equipment',
              workOrder.equipmentInfo!,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildJobDetailsCard(WorkOrder workOrder) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.info, size: 20, color: AppColors.primary),
                SizedBox(width: 8),
                Text(
                  'Job Details',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildInfoRow(
              Icons.description_outlined,
              'Description',
              workOrder.description,
            ),
            const SizedBox(height: 12),
            _buildInfoRow(
              Icons.calendar_today,
              'Scheduled Date',
              DateFormatter.formatDateTime(workOrder.scheduledDate),
            ),
            if (workOrder.dueDate != null) ...[
              const SizedBox(height: 12),
              _buildInfoRow(
                Icons.event,
                'Due Date',
                DateFormatter.formatDateTime(workOrder.dueDate!),
              ),
            ],
            if (workOrder.estimatedDuration != null) ...[
              const SizedBox(height: 12),
              _buildInfoRow(
                Icons.timer_outlined,
                'Estimated Duration',
                '${workOrder.estimatedDuration} minutes',
              ),
            ],
            if (workOrder.technicianName != null) ...[
              const SizedBox(height: 12),
              _buildInfoRow(
                Icons.engineering_outlined,
                'Assigned Technician',
                workOrder.technicianName!,
              ),
            ],
            if (workOrder.estimatedCompletionDate != null) ...[
              const SizedBox(height: 12),
              _buildInfoRow(
                Icons.event_available,
                'Estimated Completion',
                DateFormatter.formatDateTime(
                  workOrder.estimatedCompletionDate!,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildNotesCard(WorkOrder workOrder) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.note, size: 20, color: AppColors.primary),
                SizedBox(width: 8),
                Text(
                  'Notes',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              workOrder.notes!,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEquipmentTrackingCard(WorkOrder workOrder) {
    final equipmentStatus = workOrder.equipmentStatus!;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.track_changes, size: 20, color: AppColors.primary),
                SizedBox(width: 8),
                Text(
                  'Equipment Tracking',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _getEquipmentStatusColor(
                  equipmentStatus.currentStatus,
                ).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _getEquipmentStatusColor(
                    equipmentStatus.currentStatus,
                  ).withValues(alpha: 0.3),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.circle,
                    size: 12,
                    color: _getEquipmentStatusColor(
                      equipmentStatus.currentStatus,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Current Status',
                          style: TextStyle(
                            fontSize: 12,
                            color: _getEquipmentStatusColor(
                              equipmentStatus.currentStatus,
                            ),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _getEquipmentStatusText(
                            equipmentStatus.currentStatus,
                          ),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: _getEquipmentStatusColor(
                              equipmentStatus.currentStatus,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _buildEquipmentStatusTimeline(equipmentStatus),
          ],
        ),
      ),
    );
  }

  Widget _buildInventoryOrderCard() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: const [
                    Icon(Icons.inventory_2, size: 20, color: AppColors.primary),
                    SizedBox(width: 8),
                    Text(
                      'Inventory Orders',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
                TextButton.icon(
                  onPressed: () => _showInventoryOrderDialog(),
                  icon: const Icon(Icons.add_shopping_cart, size: 18),
                  label: const Text('Order More'),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_isLoadingOrders)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_inventoryOrders.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[200]!),
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.inventory_2_outlined,
                      size: 48,
                      color: Colors.grey[400],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'No inventory ordered yet',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Order parts and materials needed for this work order',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () => _showInventoryOrderDialog(),
                      icon: const Icon(Icons.shopping_cart),
                      label: const Text('Browse Inventory'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
              )
            else ...[
              if (_orderSummary != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.1),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildSummaryItem(
                          'Total Items',
                          _orderSummary!.totalItems.toString(),
                          Icons.shopping_bag,
                        ),
                      ),
                      Container(width: 1, height: 30, color: Colors.grey[300]),
                      Expanded(
                        child: _buildSummaryItem(
                          'Total Value',
                          '\$${_orderSummary!.totalValue.toStringAsFixed(2)}',
                          Icons.attach_money,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _inventoryOrders.length,
                separatorBuilder: (context, index) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final order = _inventoryOrders[index];
                  return _buildOrderItem(order);
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, IconData icon) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, size: 16, color: AppColors.primary),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
            ),
            Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildOrderItem(InventoryOrder order) {
    final statusColor = _getOrderStatusColor(order.status);
    final statusText = _getOrderStatusText(order.status);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      order.partName,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Part #${order.partNumber}',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                ),
                child: Text(
                  statusText,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Qty: ${order.quantity} × \$${order.unitPrice.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
              Text(
                '\$${order.totalPrice.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(Icons.person_outline, size: 12, color: Colors.grey[500]),
              const SizedBox(width: 4),
              Text(
                'Ordered by ${order.orderedByName ?? 'Unknown'}',
                style: TextStyle(fontSize: 11, color: Colors.grey[600]),
              ),
              const SizedBox(width: 8),
              Icon(Icons.access_time, size: 12, color: Colors.grey[500]),
              const SizedBox(width: 4),
              Text(
                DateFormatter.formatDateTime(order.orderedAt),
                style: TextStyle(fontSize: 11, color: Colors.grey[600]),
              ),
            ],
          ),
          if (order.notes != null && order.notes!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.note_outlined, size: 14, color: Colors.grey[600]),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      order.notes!,
                      style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _getOrderStatusColor(InventoryOrderStatus status) {
    switch (status) {
      case InventoryOrderStatus.pending:
        return AppColors.warning;
      case InventoryOrderStatus.ordered:
        return AppColors.info;
      case InventoryOrderStatus.accepted:
        return Colors.blue;
      case InventoryOrderStatus.delivered:
        return AppColors.success;
      case InventoryOrderStatus.cancelled:
        return AppColors.error;
    }
  }

  String _getOrderStatusText(InventoryOrderStatus status) {
    switch (status) {
      case InventoryOrderStatus.pending:
        return 'Pending';
      case InventoryOrderStatus.ordered:
        return 'Ordered';
      case InventoryOrderStatus.accepted:
        return 'Accepted';
      case InventoryOrderStatus.delivered:
        return 'Delivered';
      case InventoryOrderStatus.cancelled:
        return 'Cancelled';
    }
  }

  Widget _buildEquipmentStatusTimeline(EquipmentStatus equipmentStatus) {
    final statuses = [
      (EquipmentRepairStatus.pendingIntake, equipmentStatus.pendingIntakeAt),
      (EquipmentRepairStatus.inTransit, equipmentStatus.inTransitAt),
      (EquipmentRepairStatus.received, equipmentStatus.receivedAt),
      (EquipmentRepairStatus.inRepair, equipmentStatus.inRepairAt),
      (
        EquipmentRepairStatus.repairCompleted,
        equipmentStatus.repairCompletedAt,
      ),
      (EquipmentRepairStatus.readyForPickup, equipmentStatus.readyForPickupAt),
      (EquipmentRepairStatus.outForDelivery, equipmentStatus.outForDeliveryAt),
      (EquipmentRepairStatus.returned, equipmentStatus.returnedAt),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Status History',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 12),
        ...statuses.map((statusData) {
          final status = statusData.$1;
          final timestamp = statusData.$2;
          final isCompleted = timestamp != null;
          final isCurrent = status == equipmentStatus.currentStatus;

          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? _getEquipmentStatusColor(status)
                            : Colors.transparent,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isCompleted
                              ? _getEquipmentStatusColor(status)
                              : AppColors.border,
                          width: 2,
                        ),
                      ),
                      child: isCompleted
                          ? const Icon(
                              Icons.check,
                              size: 14,
                              color: Colors.white,
                            )
                          : null,
                    ),
                    if (status != EquipmentRepairStatus.returned)
                      Container(
                        width: 2,
                        height: 24,
                        color: isCompleted
                            ? AppColors.border
                            : AppColors.border,
                      ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _getEquipmentStatusText(status),
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isCurrent
                              ? FontWeight.w600
                              : FontWeight.w500,
                          color: isCompleted
                              ? AppColors.textPrimary
                              : AppColors.textSecondary,
                        ),
                      ),
                      if (timestamp != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          DateFormatter.formatDateTime(timestamp),
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppColors.textSecondary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Color _getEquipmentStatusColor(EquipmentRepairStatus status) {
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
        return AppColors.equipmentReady;
      case EquipmentRepairStatus.outForDelivery:
        return AppColors.equipmentInTransit;
      case EquipmentRepairStatus.returned:
        return AppColors.equipmentCompleted;
    }
  }

  String _getEquipmentStatusText(EquipmentRepairStatus status) {
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

  Widget _buildActionButtons(WorkOrder workOrder) {
    final buttons = <Widget>[];

    // Determine which buttons to show based on current status
    switch (workOrder.status) {
      case WorkOrderStatus.scheduled:
      case WorkOrderStatus.assigned:
        buttons.add(
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () => _handleStatusUpdate(
                workOrder,
                WorkOrderStatus.inProgress,
                'Start Job',
              ),
              icon: const Icon(Icons.play_arrow),
              label: const Text('Start Job'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        );
        buttons.add(const SizedBox(width: 12));
        buttons.add(
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => _handleStatusUpdate(
                workOrder,
                WorkOrderStatus.cancelled,
                'Cancel Job',
              ),
              icon: const Icon(Icons.cancel_outlined),
              label: const Text('Cancel'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: AppColors.error),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        );
        break;

      case WorkOrderStatus.inProgress:
        buttons.add(
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () => _handleCompleteJob(workOrder),
              icon: const Icon(Icons.check_circle),
              label: const Text('Complete Job'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        );
        buttons.add(const SizedBox(width: 12));
        buttons.add(
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => _handleStatusUpdate(
                workOrder,
                WorkOrderStatus.cancelled,
                'Cancel Job',
              ),
              icon: const Icon(Icons.cancel_outlined),
              label: const Text('Cancel'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: AppColors.error),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        );
        break;

      case WorkOrderStatus.completed:
      case WorkOrderStatus.cancelled:
        // No action buttons for completed or cancelled jobs
        return const SizedBox.shrink();
    }

    if (buttons.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(child: Row(children: buttons)),
    );
  }

  Future<void> _handleStatusUpdate(
    WorkOrder workOrder,
    WorkOrderStatus newStatus,
    String actionName,
  ) async {
    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(actionName),
        content: Text('Are you sure you want to ${actionName.toLowerCase()}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: newStatus == WorkOrderStatus.cancelled
                  ? AppColors.error
                  : AppColors.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    // Update status
    final success = await context
        .read<WorkOrderProvider>()
        .updateWorkOrderStatus(workOrder.id, newStatus.toApiString());

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$actionName successful'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
      // Refresh the details
      await _loadWorkOrderDetails();
    } else {
      final error = context.read<WorkOrderProvider>().error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error ?? 'Failed to $actionName'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _handleCompleteJob(WorkOrder workOrder) async {
    // Show notes input dialog
    final notesController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Complete Job'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Add completion notes (optional):'),
            const SizedBox(height: 12),
            TextField(
              controller: notesController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Enter notes about the completed work...',
                filled: true,
                fillColor: AppColors.inputBackground,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.success,
              foregroundColor: Colors.white,
            ),
            child: const Text('Complete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    // Update status with notes
    final notes = notesController.text.trim();
    final success = await context
        .read<WorkOrderProvider>()
        .updateWorkOrderStatus(
          workOrder.id,
          WorkOrderStatus.completed.toApiString(),
          notes: notes.isNotEmpty ? notes : null,
        );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Job completed successfully'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
      // Refresh the details
      await _loadWorkOrderDetails();
    } else {
      final error = context.read<WorkOrderProvider>().error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error ?? 'Failed to complete job'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }

    notesController.dispose();
  }

  // ==================== Add/Edit Notes Feature ====================

  Future<void> _showInventoryOrderDialog() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => ChangeNotifierProvider(
        create: (context) =>
            InventoryProvider(inventoryRepository: context.read()),
        child: InventoryOrderDialog(workOrderId: widget.workOrderId),
      ),
    );

    // If order was successful, refresh work order details
    if (result == true && mounted) {
      await _loadWorkOrderDetails();
    }
  }

  Future<void> _showAddNotesDialog(WorkOrder workOrder) async {
    final notesController = TextEditingController(text: workOrder.notes ?? '');

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Technician Notes'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Add or update notes about this job:',
                style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: notesController,
                maxLines: 6,
                autofocus: true,
                decoration: InputDecoration(
                  hintText:
                      'Enter notes about the work, issues found, parts needed, etc...',
                  filled: true,
                  fillColor: AppColors.inputBackground,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.all(12),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'These notes will be saved with the work order.',
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary.withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton.icon(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            icon: const Icon(Icons.save, size: 18),
            label: const Text('Save Notes'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final notes = notesController.text.trim();
      await _saveNotes(workOrder, notes);
    }

    notesController.dispose();
  }

  Future<void> _saveNotes(WorkOrder workOrder, String notes) async {
    if (!mounted) return;

    // Show loading
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
            SizedBox(width: 12),
            Text('Saving notes...'),
          ],
        ),
        duration: Duration(seconds: 30),
      ),
    );

    // Update work order with notes
    final success = await context
        .read<WorkOrderProvider>()
        .updateWorkOrderStatus(
          workOrder.id,
          workOrder.status.toApiString(),
          notes: notes,
        );

    if (!mounted) return;

    // Hide loading snackbar
    ScaffoldMessenger.of(context).hideCurrentSnackBar();

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Notes saved successfully'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
      // Refresh the details
      await _loadWorkOrderDetails();
    } else {
      final error = context.read<WorkOrderProvider>().error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error ?? 'Failed to save notes'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}
