import { apiService } from './api';
import { ApiResponse, Job } from '../types';
import type {
  EquipmentStatus,
  WorkshopMetrics,
  WorkshopSettings,
} from '../types/workshop';

export interface WorkshopQueueItem extends Job {
  equipment_status?: EquipmentStatus;
  priority_score?: number;
  days_waiting?: number;
}

export interface WorkshopQueueResponse {
  jobs: WorkshopQueueItem[];
  capacity_utilization: number;
  current_jobs: number;
  max_jobs: number;
}

export interface ClaimJobRequest {
  technician_id?: string;
}

class WorkshopService {
  /**
   * Get all workshop jobs with optional filtering
   */
  async getWorkshopJobs(params?: {
    status?: string;
    equipment_status?: string;
    priority?: string;
    customer_id?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ jobs: Job[]; pagination: any }>> {
    return apiService.get('/workshop/jobs', params);
  }

  /**
   * Get workshop queue with priority sorting
   */
  async getWorkshopQueue(params?: {
    priority?: string;
    equipment_type?: string;
    customer?: string;
  }): Promise<ApiResponse<WorkshopQueueResponse>> {
    return apiService.get('/workshop/queue', params);
  }

  /**
   * Claim a job from the workshop queue
   */
  async claimJob(jobId: string, data?: ClaimJobRequest): Promise<ApiResponse<Job>> {
    return apiService.post(`/workshop/jobs/${jobId}/claim`, data);
  }

  /**
   * Get workshop metrics
   */
  async getWorkshopMetrics(params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<WorkshopMetrics>> {
    return apiService.get('/workshop/metrics', params);
  }

  /**
   * Get workshop settings
   */
  async getWorkshopSettings(): Promise<ApiResponse<WorkshopSettings>> {
    return apiService.get('/workshop/settings');
  }

  /**
   * Update workshop settings
   */
  async updateWorkshopSettings(settings: Partial<WorkshopSettings>): Promise<ApiResponse<WorkshopSettings>> {
    return apiService.put('/workshop/settings', settings);
  }

  /**
   * Mark equipment as ready for pickup
   */
  async markReadyForPickup(jobId: string, data: {
    notify_customer: boolean;
  }): Promise<ApiResponse<Job>> {
    return apiService.post(`/workshop/jobs/${jobId}/ready-for-pickup`, data);
  }

  /**
   * Schedule delivery for equipment
   */
  async scheduleDelivery(jobId: string, data: {
    delivery_date: string;
    delivery_technician_id: string;
    delivery_fee?: number;
  }): Promise<ApiResponse<Job>> {
    return apiService.post(`/workshop/jobs/${jobId}/schedule-delivery`, data);
  }

  /**
   * Mark equipment as returned
   */
  async markEquipmentReturned(jobId: string, data: {
    customer_signature: string;
    return_notes?: string;
  }): Promise<ApiResponse<Job>> {
    return apiService.post(`/workshop/jobs/${jobId}/mark-returned`, data);
  }
}

export const workshopService = new WorkshopService();
export default workshopService;
