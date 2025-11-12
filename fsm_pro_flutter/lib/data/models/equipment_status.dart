enum EquipmentRepairStatus {
  pendingIntake,
  inTransit,
  received,
  inRepair,
  repairCompleted,
  readyForPickup,
  outForDelivery,
  returned;

  static EquipmentRepairStatus fromString(String status) {
    switch (status.toLowerCase().replaceAll('_', '').replaceAll('-', '')) {
      case 'pendingintake':
        return EquipmentRepairStatus.pendingIntake;
      case 'intransit':
        return EquipmentRepairStatus.inTransit;
      case 'received':
        return EquipmentRepairStatus.received;
      case 'inrepair':
        return EquipmentRepairStatus.inRepair;
      case 'repaircompleted':
        return EquipmentRepairStatus.repairCompleted;
      case 'readyforpickup':
        return EquipmentRepairStatus.readyForPickup;
      case 'outfordelivery':
        return EquipmentRepairStatus.outForDelivery;
      case 'returned':
        return EquipmentRepairStatus.returned;
      default:
        return EquipmentRepairStatus.pendingIntake;
    }
  }

  String toApiString() {
    switch (this) {
      case EquipmentRepairStatus.pendingIntake:
        return 'pending_intake';
      case EquipmentRepairStatus.inTransit:
        return 'in_transit';
      case EquipmentRepairStatus.received:
        return 'received';
      case EquipmentRepairStatus.inRepair:
        return 'in_repair';
      case EquipmentRepairStatus.repairCompleted:
        return 'repair_completed';
      case EquipmentRepairStatus.readyForPickup:
        return 'ready_for_pickup';
      case EquipmentRepairStatus.outForDelivery:
        return 'out_for_delivery';
      case EquipmentRepairStatus.returned:
        return 'returned';
    }
  }
}

class EquipmentStatusHistory {
  final String id;
  final String equipmentStatusId;
  final EquipmentRepairStatus status;
  final String? notes;
  final String? changedBy;
  final DateTime timestamp;

  const EquipmentStatusHistory({
    required this.id,
    required this.equipmentStatusId,
    required this.status,
    this.notes,
    this.changedBy,
    required this.timestamp,
  });

  factory EquipmentStatusHistory.fromJson(Map<String, dynamic> json) {
    return EquipmentStatusHistory(
      id: json['id']?.toString() ?? '',
      equipmentStatusId:
          json['equipment_status_id']?.toString() ??
          json['equipmentStatusId']?.toString() ??
          '',
      status: EquipmentRepairStatus.fromString(
        json['status'] ?? 'pending_intake',
      ),
      notes: json['notes'],
      changedBy:
          json['changed_by']?.toString() ?? json['changedBy']?.toString(),
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'equipment_status_id': equipmentStatusId,
      'status': status.toApiString(),
      if (notes != null) 'notes': notes,
      if (changedBy != null) 'changed_by': changedBy,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

class EquipmentStatus {
  final String id;
  final String jobId;
  final String companyId;
  final EquipmentRepairStatus currentStatus;
  final DateTime? pendingIntakeAt;
  final DateTime? inTransitAt;
  final DateTime? receivedAt;
  final DateTime? inRepairAt;
  final DateTime? repairCompletedAt;
  final DateTime? readyForPickupAt;
  final DateTime? outForDeliveryAt;
  final DateTime? returnedAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<EquipmentStatusHistory>? history;

  const EquipmentStatus({
    required this.id,
    required this.jobId,
    required this.companyId,
    required this.currentStatus,
    this.pendingIntakeAt,
    this.inTransitAt,
    this.receivedAt,
    this.inRepairAt,
    this.repairCompletedAt,
    this.readyForPickupAt,
    this.outForDeliveryAt,
    this.returnedAt,
    required this.createdAt,
    required this.updatedAt,
    this.history,
  });

  factory EquipmentStatus.fromJson(Map<String, dynamic> json) {
    return EquipmentStatus(
      id: json['id']?.toString() ?? '',
      jobId: json['job_id']?.toString() ?? json['jobId']?.toString() ?? '',
      companyId:
          json['company_id']?.toString() ?? json['companyId']?.toString() ?? '',
      currentStatus: EquipmentRepairStatus.fromString(
        json['current_status'] ?? json['currentStatus'] ?? 'pending_intake',
      ),
      pendingIntakeAt: json['pending_intake_at'] != null
          ? DateTime.parse(json['pending_intake_at'])
          : json['pendingIntakeAt'] != null
          ? DateTime.parse(json['pendingIntakeAt'])
          : null,
      inTransitAt: json['in_transit_at'] != null
          ? DateTime.parse(json['in_transit_at'])
          : json['inTransitAt'] != null
          ? DateTime.parse(json['inTransitAt'])
          : null,
      receivedAt: json['received_at'] != null
          ? DateTime.parse(json['received_at'])
          : json['receivedAt'] != null
          ? DateTime.parse(json['receivedAt'])
          : null,
      inRepairAt: json['in_repair_at'] != null
          ? DateTime.parse(json['in_repair_at'])
          : json['inRepairAt'] != null
          ? DateTime.parse(json['inRepairAt'])
          : null,
      repairCompletedAt: json['repair_completed_at'] != null
          ? DateTime.parse(json['repair_completed_at'])
          : json['repairCompletedAt'] != null
          ? DateTime.parse(json['repairCompletedAt'])
          : null,
      readyForPickupAt: json['ready_for_pickup_at'] != null
          ? DateTime.parse(json['ready_for_pickup_at'])
          : json['readyForPickupAt'] != null
          ? DateTime.parse(json['readyForPickupAt'])
          : null,
      outForDeliveryAt: json['out_for_delivery_at'] != null
          ? DateTime.parse(json['out_for_delivery_at'])
          : json['outForDeliveryAt'] != null
          ? DateTime.parse(json['outForDeliveryAt'])
          : null,
      returnedAt: json['returned_at'] != null
          ? DateTime.parse(json['returned_at'])
          : json['returnedAt'] != null
          ? DateTime.parse(json['returnedAt'])
          : null,
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
      history: json['history'] != null
          ? (json['history'] as List)
                .map((h) => EquipmentStatusHistory.fromJson(h))
                .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'job_id': jobId,
      'company_id': companyId,
      'current_status': currentStatus.toApiString(),
      if (pendingIntakeAt != null)
        'pending_intake_at': pendingIntakeAt!.toIso8601String(),
      if (inTransitAt != null) 'in_transit_at': inTransitAt!.toIso8601String(),
      if (receivedAt != null) 'received_at': receivedAt!.toIso8601String(),
      if (inRepairAt != null) 'in_repair_at': inRepairAt!.toIso8601String(),
      if (repairCompletedAt != null)
        'repair_completed_at': repairCompletedAt!.toIso8601String(),
      if (readyForPickupAt != null)
        'ready_for_pickup_at': readyForPickupAt!.toIso8601String(),
      if (outForDeliveryAt != null)
        'out_for_delivery_at': outForDeliveryAt!.toIso8601String(),
      if (returnedAt != null) 'returned_at': returnedAt!.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      if (history != null) 'history': history!.map((h) => h.toJson()).toList(),
    };
  }

  EquipmentStatus copyWith({
    String? id,
    String? jobId,
    String? companyId,
    EquipmentRepairStatus? currentStatus,
    DateTime? pendingIntakeAt,
    DateTime? inTransitAt,
    DateTime? receivedAt,
    DateTime? inRepairAt,
    DateTime? repairCompletedAt,
    DateTime? readyForPickupAt,
    DateTime? outForDeliveryAt,
    DateTime? returnedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<EquipmentStatusHistory>? history,
  }) {
    return EquipmentStatus(
      id: id ?? this.id,
      jobId: jobId ?? this.jobId,
      companyId: companyId ?? this.companyId,
      currentStatus: currentStatus ?? this.currentStatus,
      pendingIntakeAt: pendingIntakeAt ?? this.pendingIntakeAt,
      inTransitAt: inTransitAt ?? this.inTransitAt,
      receivedAt: receivedAt ?? this.receivedAt,
      inRepairAt: inRepairAt ?? this.inRepairAt,
      repairCompletedAt: repairCompletedAt ?? this.repairCompletedAt,
      readyForPickupAt: readyForPickupAt ?? this.readyForPickupAt,
      outForDeliveryAt: outForDeliveryAt ?? this.outForDeliveryAt,
      returnedAt: returnedAt ?? this.returnedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      history: history ?? this.history,
    );
  }
}
