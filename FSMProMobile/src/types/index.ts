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
  // Joined fields
  customer_name?: string;
  equipment_info?: string;
  technician_name?: string;
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
