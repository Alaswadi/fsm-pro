import { apiService } from './api';
import { ApiResponse } from '../types';
import type { EquipmentIntake, IntakePhoto } from '../types/workshop';

export interface CreateIntakeRequest {
  job_id: string;
  reported_issue: string;
  visual_condition?: string;
  physical_damage_notes?: string;
  accessories_included?: string;
  customer_signature?: string;
  customer_notes?: string;
  internal_notes?: string;
  estimated_repair_time?: number;
}

export interface UpdateIntakeRequest {
  reported_issue?: string;
  visual_condition?: string;
  physical_damage_notes?: string;
  accessories_included?: string;
  customer_signature?: string;
  customer_notes?: string;
  internal_notes?: string;
  estimated_repair_time?: number;
}

class IntakeService {
  /**
   * Create equipment intake record
   */
  async createIntake(data: CreateIntakeRequest): Promise<ApiResponse<EquipmentIntake>> {
    return apiService.post('/workshop/intake', data);
  }

  /**
   * Get intake record by job ID
   */
  async getIntakeByJobId(jobId: string): Promise<ApiResponse<EquipmentIntake>> {
    return apiService.get(`/workshop/intake/${jobId}`);
  }

  /**
   * Update intake record
   */
  async updateIntake(intakeId: string, data: UpdateIntakeRequest): Promise<ApiResponse<EquipmentIntake>> {
    return apiService.put(`/workshop/intake/${intakeId}`, data);
  }

  /**
   * Upload intake photos
   */
  async uploadIntakePhotos(
    intakeId: string,
    files: File[],
    photoTypes?: string[]
  ): Promise<ApiResponse<IntakePhoto[]>> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('photos', file);
      if (photoTypes && photoTypes[index]) {
        formData.append('photo_types', photoTypes[index]);
      }
    });

    return apiService.uploadFile(`/workshop/intake/${intakeId}/photos`, formData);
  }

  /**
   * Get intake photos
   */
  async getIntakePhotos(intakeId: string): Promise<ApiResponse<IntakePhoto[]>> {
    return apiService.get(`/workshop/intake/${intakeId}/photos`);
  }

  /**
   * Delete intake photo
   */
  async deleteIntakePhoto(photoId: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/workshop/intake/photos/${photoId}`);
  }
}

export const intakeService = new IntakeService();
export default intakeService;
