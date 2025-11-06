import { apiService } from './api';
import { ApiResponse } from '../types';
import type { EquipmentStatus, EquipmentStatusHistory, EquipmentRepairStatus } from '../types/workshop';

export interface UpdateStatusRequest {
  status: EquipmentRepairStatus;
  notes?: string;
}

class StatusService {
  /**
   * Get current equipment status for a job
   */
  async getEquipmentStatus(jobId: string): Promise<ApiResponse<EquipmentStatus>> {
    return apiService.get(`/workshop/status/${jobId}`);
  }

  /**
   * Update equipment status
   */
  async updateStatus(jobId: string, data: UpdateStatusRequest): Promise<ApiResponse<EquipmentStatus>> {
    return apiService.put(`/workshop/status/${jobId}`, data);
  }

  /**
   * Get status history for a job
   */
  async getStatusHistory(jobId: string): Promise<ApiResponse<EquipmentStatusHistory[]>> {
    return apiService.get(`/workshop/status/${jobId}/history`);
  }
}

export const statusService = new StatusService();
export default statusService;
