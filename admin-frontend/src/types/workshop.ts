// Workshop/Depot Repair Types for Frontend
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
