// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'technician' | 'customer';
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Technician Types
export interface Technician {
  id: string;
  company_id: string;
  user_id: string;
  employee_id: string;
  skills: string[];
  certifications: string[];
  hourly_rate?: number;
  is_available: boolean;
  current_location?: { x: number; y: number };
  max_jobs_per_day: number;
  working_hours?: any;
  created_at: string;
  updated_at: string;
  // Joined user fields
  full_name?: string;
  email?: string;
  phone?: string;
}

// Customer Types
export interface Customer {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Equipment Types
export interface Equipment {
  id: string;
  customer_id: string;
  brand: string;
  model: string;
  serial_number: string;
  equipment_type: string;
  installation_date?: string;
  warranty_expiry?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  customer_name?: string;
}

// Job/Work Order Types
export interface Job {
  id: string;
  customer_id: string;
  equipment_id?: string;
  technician_id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  due_date?: string;
  estimated_duration?: number;
  actual_duration?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Workshop fields
  location_type?: 'on_site' | 'workshop';
  estimated_completion_date?: string;
  pickup_delivery_fee?: number;
  delivery_scheduled_date?: string;
  delivery_technician_id?: string;
  // Joined fields
  customer_name?: string;
  equipment_info?: string;
  technician_name?: string;
  equipment_intake?: EquipmentIntake;
  equipment_status?: EquipmentStatus;
}

// Workshop Types
export type EquipmentRepairStatus = 
  | 'pending_intake'
  | 'in_transit'
  | 'received'
  | 'in_repair'
  | 'repair_completed'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'returned';

export interface EquipmentIntake {
  id: string;
  job_id: string;
  company_id: string;
  intake_date: string;
  received_by?: string;
  reported_issue: string;
  visual_condition?: string;
  physical_damage_notes?: string;
  accessories_included?: string;
  customer_signature?: string;
  customer_notes?: string;
  internal_notes?: string;
  estimated_repair_time?: number;
  created_at: string;
  updated_at: string;
  photos?: IntakePhoto[];
}

export interface EquipmentStatus {
  id: string;
  job_id: string;
  company_id: string;
  current_status: EquipmentRepairStatus;
  pending_intake_at?: string;
  in_transit_at?: string;
  received_at?: string;
  in_repair_at?: string;
  repair_completed_at?: string;
  ready_for_pickup_at?: string;
  out_for_delivery_at?: string;
  returned_at?: string;
  created_at: string;
  updated_at: string;
  history?: EquipmentStatusHistory[];
}

export interface EquipmentStatusHistory {
  id: string;
  equipment_status_id: string;
  job_id: string;
  from_status?: EquipmentRepairStatus;
  to_status: EquipmentRepairStatus;
  changed_at: string;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

export interface IntakePhoto {
  id: string;
  equipment_intake_id: string;
  photo_url: string;
  photo_type?: string;
  caption?: string;
  taken_at: string;
  uploaded_by?: string;
  created_at: string;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  WorkOrderDetails: { jobId: string };
  Profile: undefined;
};

export type TabParamList = {
  WorkOrders: undefined;
  Schedule: undefined;
  Inventory: undefined;
  Profile: undefined;
};

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface JobUpdateFormData {
  status: Job['status'];
  notes?: string;
  actual_duration?: number;
}

// API Error Types
export interface ApiError {
  success: false;
  error: string;
  details?: any;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  company_id: string;
  part_number: string;
  name: string;
  description?: string;
  category?: string;
  equipment_type_id?: string;
  unit_price: number;
  cost_price?: number;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  status: string;
  supplier_info?: any;
  compatible_equipment?: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
  equipment_type?: any;
}

// File Upload Types
export interface FileUploadResponse {
  success: boolean;
  filename?: string;
  url?: string;
  error?: string;
}

// Push Notification Types
export interface PushNotificationData {
  type: 'job_assigned' | 'job_updated' | 'job_cancelled' | 'system_alert';
  jobId?: string;
  title: string;
  body: string;
  data?: any;
}
