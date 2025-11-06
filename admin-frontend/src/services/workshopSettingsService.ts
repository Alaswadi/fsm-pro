import { apiService } from './api';
import { ApiResponse } from '../types';
import type { WorkshopSettings } from '../types/workshop';

class WorkshopSettingsService {
  /**
   * Get workshop settings for the current company
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
}

export const workshopSettingsService = new WorkshopSettingsService();
export default workshopSettingsService;
