export type UserRole = 'super_admin' | 'admin' | 'manager' | 'technician' | 'customer';
export type JobStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Customer {
  id: string;
  company_id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone: string;
  whatsapp_number?: string;
  address: string;
  location_coordinates?: { x: number; y: number };
  company_name?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
  user?: User;
}

export interface Job {
  id: string;
  company_id: string;
  customer_id: string;
  equipment_id?: string;
  technician_id?: string;
  job_number: string;
  title: string;
  description: string;
  priority: JobPriority;
  status: JobStatus;
  scheduled_date?: string;
  started_at?: string;
  completed_at?: string;
  estimated_duration?: number;
  actual_duration?: number;
  customer_signature?: string;
  technician_notes?: string;
  customer_feedback?: string;
  rating?: number;
  total_cost?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  technician?: Technician;
}

export interface EquipmentType {
  id: string;
  company_id: string;
  name: string;
  brand: string;
  model: string;
  category?: string;
  description?: string;
  manual_url?: string;
  warranty_period_months: number;
  image_url?: string;
  specifications?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerEquipment {
  id: string;
  company_id: string;
  customer_id: string;
  equipment_type_id: string;
  serial_number: string;
  asset_tag?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  installation_date?: string;
  location_details?: string;
  condition: string;
  last_service_date?: string;
  next_service_date?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  equipment_type?: EquipmentType;
  customer?: Customer;
}

export interface EquipmentInventoryCompatibility {
  id: string;
  equipment_type_id: string;
  part_id: string;
  compatibility_type: string;
  usage_notes?: string;
  created_at: string;
  updated_at: string;
  equipment_type?: EquipmentType;
  part?: Part;
}

export interface Part {
  id: string;
  company_id: string;
  part_number: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
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
}

export interface DashboardStats {
  activeWorkOrders: number;
  availableTechnicians: number;
  completionRate: number;
  monthlyRevenue: number;
  workOrderTrend: number;
  technicianTrend: number;
  completionTrend: number;
  revenueTrend: number;
}

export interface TechniciansResponse {
  technicians: Technician[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EquipmentTypesResponse {
  equipment_types: EquipmentType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerEquipmentResponse {
  customer_equipment: CustomerEquipment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EquipmentCompatibilityResponse {
  compatibility: EquipmentInventoryCompatibility[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
