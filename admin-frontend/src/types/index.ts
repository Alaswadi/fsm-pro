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
  industry?: string;
  company_size?: string;
  business_type?: string;
  tax_id?: string;
  website?: string;
  billing_address?: string;
  billing_contact_name?: string;
  billing_contact_email?: string;
  billing_contact_phone?: string;
  preferred_contact_method?: string;
  service_tier?: string;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  payment_terms?: string;
  credit_limit?: number;
  discount_percentage?: number;
  priority_level?: string;
  assigned_account_manager?: string;
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
  due_date?: string;
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
  equipment?: {
    id: string;
    serial_number: string;
    asset_tag?: string;
    location_details?: string;
    equipment_type?: {
      name: string;
      brand: string;
      model: string;
      category?: string;
    };
  };
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



export interface Part {
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
  equipment_type?: EquipmentType;
}

export interface DashboardStats {
  activeWorkOrders: number;
  availableTechnicians: number;
  totalCustomers: number;
  totalEquipment: number;
  completionRate: number;
  monthlyRevenue: number;
  workOrderTrend: number;
  technicianTrend: number;
  completionTrend: number;
  revenueTrend: number;
  overdueWorkOrders: number;
  equipmentNeedingMaintenance: number;
}

export interface RecentActivity {
  id: string;
  type: 'work_order' | 'technician' | 'customer' | 'equipment' | 'completion';
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  timestamp: string;
  relativeTime: string;
}

export interface DashboardData {
  stats: DashboardStats;
  activities: RecentActivity[];
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

export interface CustomersResponse {
  customers: Customer[];
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



export interface InventoryResponse {
  inventory_items: Part[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InventoryOptions {
  categories: string[];
  equipment_types: EquipmentType[];
  statuses: string[];
}

export interface LowStockAlert {
  id: string;
  part_number: string;
  name: string;
  current_stock: number;
  min_stock_level: number;
  alert_level: 'critical' | 'low' | 'normal';
}

export interface LowStockAlertsResponse {
  alerts: LowStockAlert[];
  summary: {
    critical: number;
    low: number;
    total: number;
  };
}

// Work Orders / Jobs related types
export interface JobsResponse {
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JobOptions {
  customers: Array<{
    id: string;
    name: string;
    company_name?: string;
  }>;
  technicians: Array<{
    id: string;
    employee_id: string;
    full_name: string;
    is_available: boolean;
  }>;
  equipment_types: Array<{
    id: string;
    name: string;
    brand: string;
    model: string;
  }>;
  priorities: JobPriority[];
  statuses: JobStatus[];
}

export interface CustomerEquipmentForJob {
  id: string;
  serial_number: string;
  asset_tag?: string;
  location_details?: string;
  equipment_name: string;
  brand: string;
  model: string;
}
