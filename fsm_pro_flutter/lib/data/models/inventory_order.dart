/// Inventory order status enum
enum InventoryOrderStatus {
  pending,
  ordered,
  accepted,
  delivered,
  cancelled;

  String toApiString() {
    return name;
  }

  static InventoryOrderStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return InventoryOrderStatus.pending;
      case 'ordered':
        return InventoryOrderStatus.ordered;
      case 'accepted':
        return InventoryOrderStatus.accepted;
      case 'delivered':
        return InventoryOrderStatus.delivered;
      case 'cancelled':
        return InventoryOrderStatus.cancelled;
      default:
        return InventoryOrderStatus.pending;
    }
  }
}

/// Inventory order model for work orders
class InventoryOrder {
  final String id;
  final String workOrderId;
  final String partId;
  final String partNumber;
  final String partName;
  final String? partDescription;
  final String? category;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final InventoryOrderStatus status;
  final DateTime orderedAt;
  final String? orderedByName;
  final String? orderedByEmail;
  final String? notes;
  final int currentStock;

  const InventoryOrder({
    required this.id,
    required this.workOrderId,
    required this.partId,
    required this.partNumber,
    required this.partName,
    this.partDescription,
    this.category,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    required this.status,
    required this.orderedAt,
    this.orderedByName,
    this.orderedByEmail,
    this.notes,
    required this.currentStock,
  });

  factory InventoryOrder.fromJson(Map<String, dynamic> json) {
    return InventoryOrder(
      id: json['id']?.toString() ?? '',
      workOrderId: json['work_order_id']?.toString() ?? '',
      partId: json['part_id']?.toString() ?? '',
      partNumber: json['part_number'] ?? '',
      partName: json['part_name'] ?? '',
      partDescription: json['part_description'],
      category: json['category'],
      quantity: json['quantity'] ?? 0,
      unitPrice: _parseDouble(json['unit_price']) ?? 0.0,
      totalPrice: _parseDouble(json['total_price']) ?? 0.0,
      status: InventoryOrderStatus.fromString(json['status'] ?? 'pending'),
      orderedAt: json['ordered_at'] != null
          ? DateTime.parse(json['ordered_at'])
          : DateTime.now(),
      orderedByName: json['ordered_by_name'],
      orderedByEmail: json['ordered_by_email'],
      notes: json['notes'],
      currentStock: json['current_stock'] ?? 0,
    );
  }

  /// Helper to parse double from dynamic value (string or number)
  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      return double.tryParse(value);
    }
    return null;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'work_order_id': workOrderId,
      'part_id': partId,
      'part_number': partNumber,
      'part_name': partName,
      if (partDescription != null) 'part_description': partDescription,
      if (category != null) 'category': category,
      'quantity': quantity,
      'unit_price': unitPrice,
      'total_price': totalPrice,
      'status': status.toApiString(),
      'ordered_at': orderedAt.toIso8601String(),
      if (orderedByName != null) 'ordered_by_name': orderedByName,
      if (orderedByEmail != null) 'ordered_by_email': orderedByEmail,
      if (notes != null) 'notes': notes,
      'current_stock': currentStock,
    };
  }
}

/// Summary of inventory orders for a work order
class InventoryOrderSummary {
  final int totalOrders;
  final int totalItems;
  final double totalValue;
  final Map<String, int> statusBreakdown;

  const InventoryOrderSummary({
    required this.totalOrders,
    required this.totalItems,
    required this.totalValue,
    required this.statusBreakdown,
  });

  factory InventoryOrderSummary.fromJson(Map<String, dynamic> json) {
    return InventoryOrderSummary(
      totalOrders: json['total_orders'] ?? 0,
      totalItems: json['total_items'] ?? 0,
      totalValue: (json['total_value'] ?? 0).toDouble(),
      statusBreakdown:
          (json['status_breakdown'] as Map<String, dynamic>?)?.map(
            (key, value) => MapEntry(key, value as int),
          ) ??
          {},
    );
  }
}
