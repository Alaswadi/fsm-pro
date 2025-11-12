class Equipment {
  final String id;
  final String customerId;
  final String companyId;
  final String brand;
  final String model;
  final String? serialNumber;
  final String type;
  final String? description;
  final DateTime? purchaseDate;
  final DateTime? warrantyExpiry;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Equipment({
    required this.id,
    required this.customerId,
    required this.companyId,
    required this.brand,
    required this.model,
    this.serialNumber,
    required this.type,
    this.description,
    this.purchaseDate,
    this.warrantyExpiry,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Equipment.fromJson(Map<String, dynamic> json) {
    return Equipment(
      id: json['id']?.toString() ?? '',
      customerId:
          json['customer_id']?.toString() ??
          json['customerId']?.toString() ??
          '',
      companyId:
          json['company_id']?.toString() ?? json['companyId']?.toString() ?? '',
      brand: json['brand'] ?? '',
      model: json['model'] ?? '',
      serialNumber: json['serial_number'] ?? json['serialNumber'],
      type: json['type'] ?? '',
      description: json['description'],
      purchaseDate: json['purchase_date'] != null
          ? DateTime.parse(json['purchase_date'])
          : json['purchaseDate'] != null
          ? DateTime.parse(json['purchaseDate'])
          : null,
      warrantyExpiry: json['warranty_expiry'] != null
          ? DateTime.parse(json['warranty_expiry'])
          : json['warrantyExpiry'] != null
          ? DateTime.parse(json['warrantyExpiry'])
          : null,
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
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customer_id': customerId,
      'company_id': companyId,
      'brand': brand,
      'model': model,
      if (serialNumber != null) 'serial_number': serialNumber,
      'type': type,
      if (description != null) 'description': description,
      if (purchaseDate != null)
        'purchase_date': purchaseDate!.toIso8601String(),
      if (warrantyExpiry != null)
        'warranty_expiry': warrantyExpiry!.toIso8601String(),
      if (notes != null) 'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Equipment copyWith({
    String? id,
    String? customerId,
    String? companyId,
    String? brand,
    String? model,
    String? serialNumber,
    String? type,
    String? description,
    DateTime? purchaseDate,
    DateTime? warrantyExpiry,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Equipment(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      companyId: companyId ?? this.companyId,
      brand: brand ?? this.brand,
      model: model ?? this.model,
      serialNumber: serialNumber ?? this.serialNumber,
      type: type ?? this.type,
      description: description ?? this.description,
      purchaseDate: purchaseDate ?? this.purchaseDate,
      warrantyExpiry: warrantyExpiry ?? this.warrantyExpiry,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
