import { apiService } from './api';
import { ApiResponse } from '../types';
import type { WorkshopMetrics } from '../types/workshop';

interface MetricsParams {
  date_from?: string;
  date_to?: string;
}

class MetricsService {
  /**
   * Get workshop metrics with optional date range filtering
   */
  async getWorkshopMetrics(params?: MetricsParams): Promise<ApiResponse<WorkshopMetrics>> {
    return apiService.get('/workshop/metrics', params);
  }
}

export const metricsService = new MetricsService();
export default metricsService;
