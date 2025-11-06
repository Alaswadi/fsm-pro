export type UserRole = 'super_admin' | 'admin' | 'manager' | 'technician' | 'customer';
export type JobStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';
export type PartStatus = 'available' | 'low_stock' | 'out_of_stock' | 'discontinued';
export type NotificationType = 'email' | 'sms' | 'whatsapp' | 'push';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed';

// Workshop/Depot Repair Types
export type LocationType = 'on_site' | 'workshop';
export type EquipmentRepairStatus = 
  | 'pending_intake'
  | 'in_transit'
  | 'received'
  | 'in_repair'
  | 'repair_completed'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'returned';

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

export interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  // Workshop/Depot Repair fields
  location_type: LocationType;
  estimated_completion_date?: string;
  pickup_delivery_fee?: number;
  delivery_scheduled_date?: string;
  delivery_technician_id?: string;
  // Relations
  customer?: Customer;
  technician?: Technician;
  equipment_intake?: EquipmentIntake;
  equipment_status?: EquipmentStatus;
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
  status: PartStatus;
  supplier_info?: any;
  compatible_equipment?: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
  equipment_type?: EquipmentType;
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

// Workshop/Depot Repair Interfaces

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
  // Relations
  photos?: IntakePhoto[];
  received_by_user?: User;
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
  // Relations
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
  // Relations
  changed_by_user?: User;
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
  // Relations
  uploaded_by_user?: User;
}

export interface WorkshopSettings {
  id: string;
  company_id: string;
  max_concurrent_jobs: number;
  max_jobs_per_technician: number;
  default_estimated_repair_hours: number;
  default_pickup_delivery_fee: number;
  workshop_address?: string;
  workshop_phone?: string;
  workshop_hours?: any;
  send_intake_confirmation: boolean;
  send_ready_notification: boolean;
  send_status_updates: boolean;
  intake_confirmation_template?: string;
  ready_notification_template?: string;
  status_update_template?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkshopMetrics {
  total_jobs: number;
  jobs_by_status: Record<EquipmentRepairStatus, number>;
  average_repair_time_hours: number;
  on_time_completion_rate: number;
  current_capacity_utilization: number;
  jobs_per_technician: Array<{
    technician_id: string;
    technician_name: string;
    active_jobs: number;
  }>;
}

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: User;
  company?: Company;
  company_id?: string;
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
