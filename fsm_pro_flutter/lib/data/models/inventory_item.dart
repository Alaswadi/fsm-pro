enum StockLevel { adequate, low, critical, outOfStock }

class InventoryItem {
  final String id;
  final String companyId;
  final String partNumber;
  final String name;
  final String? description;
  final String? category;
  final double unitPrice;
  final double? costPrice;
  final int currentStock;
  final int minStockLevel;
  final int maxStockLevel;
  final String status;
  final String? imageUrl;
  final DateTime createdAt;
  final DateTime updatedAt;

  const InventoryItem({
    required this.id,
    required this.companyId,
    required this.partNumber,
    required this.name,
    this.description,
    this.category,
    required this.unitPrice,
    this.costPrice,
    required this.currentStock,
    required this.minStockLevel,
    required this.maxStockLevel,
    required this.status,
    this.imageUrl,
    required this.createdAt,
    required this.updatedAt,
  });

  StockLevel get stockLevel {
    if (currentStock == 0) return StockLevel.outOfStock;
    if (currentStock <= minStockLevel) return StockLevel.critical;
    if (currentStock <= (minStockLevel * 1.5).round()) return StockLevel.low;
    return StockLevel.adequate;
  }

  factory InventoryItem.fromJson(Map<String, dynamic> json) {
    return InventoryItem(
      id: json['id']?.toString() ?? '',
      companyId:
          json['company_id']?.toString() ?? json['companyId']?.toString() ?? '',
      partNumber: json['part_number'] ?? json['partNumber'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      category: json['category'],
      unitPrice: (json['unit_price'] ?? json['unitPrice'] ?? 0).toDouble(),
      costPrice: json['cost_price'] != null
          ? (json['cost_price']).toDouble()
          : json['costPrice'] != null
          ? (json['costPrice']).toDouble()
          : null,
      currentStock: json['current_stock'] ?? json['currentStock'] ?? 0,
      minStockLevel: json['min_stock_level'] ?? json['minStockLevel'] ?? 0,
      maxStockLevel: json['max_stock_level'] ?? json['maxStockLevel'] ?? 0,
      status: json['status'] ?? 'active',
      imageUrl: json['image_url'] ?? json['imageUrl'],
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
      'company_id': companyId,
      'part_number': partNumber,
      'name': name,
      if (description != null) 'description': description,
      if (category != null) 'category': category,
      'unit_price': unitPrice,
      if (costPrice != null) 'cost_price': costPrice,
      'current_stock': currentStock,
      'min_stock_level': minStockLevel,
      'max_stock_level': maxStockLevel,
      'status': status,
      if (imageUrl != null) 'image_url': imageUrl,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  InventoryItem copyWith({
    String? id,
    String? companyId,
    String? partNumber,
    String? name,
    String? description,
    String? category,
    double? unitPrice,
    double? costPrice,
    int? currentStock,
    int? minStockLevel,
    int? maxStockLevel,
    String? status,
    String? imageUrl,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return InventoryItem(
      id: id ?? this.id,
      companyId: companyId ?? this.companyId,
      partNumber: partNumber ?? this.partNumber,
      name: name ?? this.name,
      description: description ?? this.description,
      category: category ?? this.category,
      unitPrice: unitPrice ?? this.unitPrice,
      costPrice: costPrice ?? this.costPrice,
      currentStock: currentStock ?? this.currentStock,
      minStockLevel: minStockLevel ?? this.minStockLevel,
      maxStockLevel: maxStockLevel ?? this.maxStockLevel,
      status: status ?? this.status,
      imageUrl: imageUrl ?? this.imageUrl,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
