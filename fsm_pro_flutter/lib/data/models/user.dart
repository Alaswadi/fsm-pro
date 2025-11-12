enum UserRole {
  superAdmin,
  admin,
  manager,
  technician,
  customer;

  static UserRole fromString(String role) {
    switch (role.toLowerCase()) {
      case 'super_admin':
      case 'superadmin':
        return UserRole.superAdmin;
      case 'admin':
        return UserRole.admin;
      case 'manager':
        return UserRole.manager;
      case 'technician':
        return UserRole.technician;
      case 'customer':
        return UserRole.customer;
      default:
        throw ArgumentError('Unknown user role: $role');
    }
  }

  String toApiString() {
    switch (this) {
      case UserRole.superAdmin:
        return 'super_admin';
      case UserRole.admin:
        return 'admin';
      case UserRole.manager:
        return 'manager';
      case UserRole.technician:
        return 'technician';
      case UserRole.customer:
        return 'customer';
    }
  }
}

class User {
  final String id;
  final String email;
  final String fullName;
  final String? phone;
  final UserRole role;
  final bool isActive;
  final String? avatarUrl;
  final DateTime createdAt;
  final DateTime updatedAt;

  // For technicians
  final String? technicianId;
  final List<String>? skills;
  final List<String>? certifications;
  final bool? isAvailable;

  const User({
    required this.id,
    required this.email,
    required this.fullName,
    this.phone,
    required this.role,
    required this.isActive,
    this.avatarUrl,
    required this.createdAt,
    required this.updatedAt,
    this.technicianId,
    this.skills,
    this.certifications,
    this.isAvailable,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      fullName: json['full_name'] ?? json['fullName'] ?? '',
      phone: json['phone'],
      role: UserRole.fromString(json['role'] ?? 'customer'),
      isActive: json['is_active'] ?? json['isActive'] ?? true,
      avatarUrl: json['avatar_url'] ?? json['avatarUrl'],
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
      technicianId:
          json['technician_id']?.toString() ?? json['technicianId']?.toString(),
      skills: json['skills'] != null ? List<String>.from(json['skills']) : null,
      certifications: json['certifications'] != null
          ? List<String>.from(json['certifications'])
          : null,
      isAvailable: json['is_available'] ?? json['isAvailable'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      'phone': phone,
      'role': role.toApiString(),
      'is_active': isActive,
      'avatar_url': avatarUrl,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      if (technicianId != null) 'technician_id': technicianId,
      if (skills != null) 'skills': skills,
      if (certifications != null) 'certifications': certifications,
      if (isAvailable != null) 'is_available': isAvailable,
    };
  }

  User copyWith({
    String? id,
    String? email,
    String? fullName,
    String? phone,
    UserRole? role,
    bool? isActive,
    String? avatarUrl,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? technicianId,
    List<String>? skills,
    List<String>? certifications,
    bool? isAvailable,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      isActive: isActive ?? this.isActive,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      technicianId: technicianId ?? this.technicianId,
      skills: skills ?? this.skills,
      certifications: certifications ?? this.certifications,
      isAvailable: isAvailable ?? this.isAvailable,
    );
  }
}
