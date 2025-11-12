import 'equipment_status.dart';

enum WorkOrderStatus {
  scheduled,
  assigned,
  inProgress,
  completed,
  cancelled;

  static WorkOrderStatus fromString(String status) {
    switch (status.toLowerCase().replaceAll('_', '').replaceAll('-', '')) {
      case 'scheduled':
        return WorkOrderStatus.scheduled;
      case 'assigned':
        return WorkOrderStatus.assigned;
      case 'inprogress':
        return WorkOrderStatus.inProgress;
      case 'completed':
        return WorkOrderStatus.completed;
      case 'cancelled':
        return WorkOrderStatus.cancelled;
      default:
        return WorkOrderStatus.scheduled;
    }
  }

  String toApiString() {
    switch (this) {
      case WorkOrderStatus.scheduled:
        return 'scheduled';
      case WorkOrderStatus.assigned:
        return 'assigned';
      case WorkOrderStatus.inProgress:
        return 'in_progress';
      case WorkOrderStatus.completed:
        return 'completed';
      case WorkOrderStatus.cancelled:
        return 'cancelled';
    }
  }
}

enum WorkOrderPriority {
  low,
  medium,
  high,
  urgent;

  static WorkOrderPriority fromString(String priority) {
    switch (priority.toLowerCase()) {
      case 'low':
        return WorkOrderPriority.low;
      case 'medium':
        return WorkOrderPriority.medium;
      case 'high':
        return WorkOrderPriority.high;
      case 'urgent':
        return WorkOrderPriority.urgent;
      default:
        return WorkOrderPriority.medium;
    }
  }

  String toApiString() {
    switch (this) {
      case WorkOrderPriority.low:
        return 'low';
      case WorkOrderPriority.medium:
        return 'medium';
      case WorkOrderPriority.high:
        return 'high';
      case WorkOrderPriority.urgent:
        return 'urgent';
    }
  }
}

enum LocationType {
  onSite,
  workshop;

  static LocationType fromString(String type) {
    switch (type.toLowerCase().replaceAll('_', '').replaceAll('-', '')) {
      case 'onsite':
        return LocationType.onSite;
      case 'workshop':
        return LocationType.workshop;
      default:
        return LocationType.onSite;
    }
  }

  String toApiString() {
    switch (this) {
      case LocationType.onSite:
        return 'on_site';
      case LocationType.workshop:
        return 'workshop';
    }
  }
}

class WorkOrder {
  final String id;
  final String customerId;
  final String? equipmentId;
  final String? technicianId;
  final String title;
  final String description;
  final WorkOrderPriority priority;
  final WorkOrderStatus status;
  final DateTime scheduledDate;
  final DateTime? dueDate;
  final int? estimatedDuration;
  final int? actualDuration;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Workshop fields
  final LocationType? locationType;
  final DateTime? estimatedCompletionDate;
  final double? pickupDeliveryFee;

  // Joined fields
  final String? customerName;
  final String? equipmentInfo;
  final String? technicianName;
  final EquipmentStatus? equipmentStatus;

  const WorkOrder({
    required this.id,
    required this.customerId,
    this.equipmentId,
    this.technicianId,
    required this.title,
    required this.description,
    required this.priority,
    required this.status,
    required this.scheduledDate,
    this.dueDate,
    this.estimatedDuration,
    this.actualDuration,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.locationType,
    this.estimatedCompletionDate,
    this.pickupDeliveryFee,
    this.customerName,
    this.equipmentInfo,
    this.technicianName,
    this.equipmentStatus,
  });

  /// Helper method to parse double from dynamic value (string or number)
  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      return double.tryParse(value);
    }
    return null;
  }

  factory WorkOrder.fromJson(Map<String, dynamic> json) {
    // Extract customer name from nested customer object or flat field
    String? customerName;
    if (json['customer'] != null && json['customer'] is Map) {
      customerName =
          json['customer']['name'] ?? json['customer']['company_name'];
    } else {
      customerName = json['customer_name'] ?? json['customerName'];
    }

    // Extract technician name from nested technician object or flat field
    String? technicianName;
    if (json['technician'] != null && json['technician'] is Map) {
      final tech = json['technician'];
      if (tech['user'] != null && tech['user'] is Map) {
        technicianName = tech['user']['full_name'];
      } else {
        technicianName = tech['full_name'] ?? tech['name'];
      }
    } else {
      technicianName = json['technician_name'] ?? json['technicianName'];
    }

    // Extract equipment info from nested equipment object or flat field
    String? equipmentInfo;
    if (json['equipment'] != null && json['equipment'] is Map) {
      final equip = json['equipment'];
      if (equip['equipment_type'] != null && equip['equipment_type'] is Map) {
        final type = equip['equipment_type'];
        final brand = type['brand'] ?? '';
        final model = type['model'] ?? '';
        final name = type['name'] ?? '';
        equipmentInfo = '$brand $model $name'.trim();
        if (equipmentInfo.isEmpty) equipmentInfo = null;
      } else {
        equipmentInfo = equip['name'] ?? equip['type'];
      }
    } else {
      equipmentInfo = json['equipment_info'] ?? json['equipmentInfo'];
    }

    return WorkOrder(
      id: json['id']?.toString() ?? '',
      customerId:
          json['customer_id']?.toString() ??
          json['customerId']?.toString() ??
          '',
      equipmentId:
          json['equipment_id']?.toString() ?? json['equipmentId']?.toString(),
      technicianId:
          json['technician_id']?.toString() ?? json['technicianId']?.toString(),
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      priority: WorkOrderPriority.fromString(json['priority'] ?? 'medium'),
      status: WorkOrderStatus.fromString(json['status'] ?? 'scheduled'),
      scheduledDate: json['scheduled_date'] != null
          ? DateTime.parse(json['scheduled_date'])
          : json['scheduledDate'] != null
          ? DateTime.parse(json['scheduledDate'])
          : DateTime.now(),
      dueDate: json['due_date'] != null
          ? DateTime.parse(json['due_date'])
          : json['dueDate'] != null
          ? DateTime.parse(json['dueDate'])
          : null,
      estimatedDuration:
          json['estimated_duration'] ?? json['estimatedDuration'],
      actualDuration: json['actual_duration'] ?? json['actualDuration'],
      notes: json['notes'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
      locationType: json['location_type'] != null
          ? LocationType.fromString(json['location_type'])
          : json['locationType'] != null
          ? LocationType.fromString(json['locationType'])
          : null,
      estimatedCompletionDate: json['estimated_completion_date'] != null
          ? DateTime.parse(json['estimated_completion_date'])
          : json['estimatedCompletionDate'] != null
          ? DateTime.parse(json['estimatedCompletionDate'])
          : null,
      pickupDeliveryFee:
          _parseDouble(json['pickup_delivery_fee']) ??
          _parseDouble(json['pickupDeliveryFee']),
      customerName: customerName,
      equipmentInfo: equipmentInfo,
      technicianName: technicianName,
      equipmentStatus: json['equipment_status'] != null
          ? EquipmentStatus.fromJson(json['equipment_status'])
          : json['equipmentStatus'] != null
          ? EquipmentStatus.fromJson(json['equipmentStatus'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customer_id': customerId,
      if (equipmentId != null) 'equipment_id': equipmentId,
      if (technicianId != null) 'technician_id': technicianId,
      'title': title,
      'description': description,
      'priority': priority.toApiString(),
      'status': status.toApiString(),
      'scheduled_date': scheduledDate.toIso8601String(),
      if (dueDate != null) 'due_date': dueDate!.toIso8601String(),
      if (estimatedDuration != null) 'estimated_duration': estimatedDuration,
      if (actualDuration != null) 'actual_duration': actualDuration,
      if (notes != null) 'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      if (locationType != null) 'location_type': locationType!.toApiString(),
      if (estimatedCompletionDate != null)
        'estimated_completion_date': estimatedCompletionDate!.toIso8601String(),
      if (pickupDeliveryFee != null) 'pickup_delivery_fee': pickupDeliveryFee,
      if (customerName != null) 'customer_name': customerName,
      if (equipmentInfo != null) 'equipment_info': equipmentInfo,
      if (technicianName != null) 'technician_name': technicianName,
      if (equipmentStatus != null)
        'equipment_status': equipmentStatus!.toJson(),
    };
  }

  WorkOrder copyWith({
    String? id,
    String? customerId,
    String? equipmentId,
    String? technicianId,
    String? title,
    String? description,
    WorkOrderPriority? priority,
    WorkOrderStatus? status,
    DateTime? scheduledDate,
    DateTime? dueDate,
    int? estimatedDuration,
    int? actualDuration,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
    LocationType? locationType,
    DateTime? estimatedCompletionDate,
    double? pickupDeliveryFee,
    String? customerName,
    String? equipmentInfo,
    String? technicianName,
    EquipmentStatus? equipmentStatus,
  }) {
    return WorkOrder(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      equipmentId: equipmentId ?? this.equipmentId,
      technicianId: technicianId ?? this.technicianId,
      title: title ?? this.title,
      description: description ?? this.description,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      dueDate: dueDate ?? this.dueDate,
      estimatedDuration: estimatedDuration ?? this.estimatedDuration,
      actualDuration: actualDuration ?? this.actualDuration,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      locationType: locationType ?? this.locationType,
      estimatedCompletionDate:
          estimatedCompletionDate ?? this.estimatedCompletionDate,
      pickupDeliveryFee: pickupDeliveryFee ?? this.pickupDeliveryFee,
      customerName: customerName ?? this.customerName,
      equipmentInfo: equipmentInfo ?? this.equipmentInfo,
      technicianName: technicianName ?? this.technicianName,
      equipmentStatus: equipmentStatus ?? this.equipmentStatus,
    );
  }
}
