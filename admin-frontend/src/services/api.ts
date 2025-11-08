import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, LoginCredentials, User } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Use relative URL in production to work with nginx reverse proxy
    // In development, use localhost
    const baseURL = process.env.NODE_ENV === 'production'
      ? '/api'  // Relative URL - works with nginx reverse proxy
      : (process.env.REACT_APP_API_URL || 'http://localhost:3001/api');

    console.log('API Base URL:', baseURL);
    console.log('Environment:', process.env.NODE_ENV);

    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('fsm_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        console.error('API Error:', error);

        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('fsm_token');
          localStorage.removeItem('fsm_user');
          window.location.href = '/login';
        } else if (error.response?.status === 429) {
          // Rate limit exceeded - don't logout, just show error
          console.warn('Rate limit exceeded, please slow down requests');
          // Don't redirect to login for rate limiting
        } else if (error.code === 'ERR_NETWORK' || !error.response) {
          // Network error or CORS issue
          console.error('Network error or CORS issue:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    console.log('Making login request to:', this.api.defaults.baseURL + '/auth/login');
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: any): Promise<ApiResponse<{ user: User }>> {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.api.post('/auth/logout');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Generic CRUD methods
  async get<T>(endpoint: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.api.get(endpoint, { params });
    return response.data;
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.api.post(endpoint, data);
    return response.data;
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.api.put(endpoint, data);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await this.api.delete(endpoint);
    return response.data;
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.api.patch(endpoint, data);
    return response.data;
  }

  // File upload method
  async uploadFile<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const response = await this.api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Technicians specific methods
  async getTechnicians(params?: any): Promise<ApiResponse<any>> {
    return this.get('/technicians', params);
  }

  async getTechnician(id: string): Promise<ApiResponse<any>> {
    return this.get(`/technicians/${id}`);
  }

  async createTechnician(data: any): Promise<ApiResponse<any>> {
    return this.post('/technicians', data);
  }

  async updateTechnician(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/technicians/${id}`, data);
  }

  async deleteTechnician(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/technicians/${id}`);
  }

  async toggleTechnicianAvailability(id: string): Promise<ApiResponse<any>> {
    return this.patch(`/technicians/${id}/availability`);
  }

  // Customers specific methods
  async getCustomers(params?: any): Promise<ApiResponse<any>> {
    return this.get('/customers', params);
  }

  async getCustomer(id: string): Promise<ApiResponse<any>> {
    return this.get(`/customers/${id}`);
  }

  async createCustomer(data: any): Promise<ApiResponse<any>> {
    return this.post('/customers', data);
  }

  async updateCustomer(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/customers/${id}`, data);
  }

  async deleteCustomer(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/customers/${id}`);
  }

  async toggleCustomerStatus(id: string): Promise<ApiResponse<any>> {
    return this.patch(`/customers/${id}/status`);
  }

  // Customer Equipment methods
  async getCustomerEquipment(customerId: string, params?: any): Promise<ApiResponse<any>> {
    const queryParams = { ...params, customer_id: customerId };
    return this.get('/equipment/customer-equipment', queryParams);
  }

  async getCustomerEquipmentById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/equipment/customer-equipment/${id}`);
  }

  async createCustomerEquipment(data: any): Promise<ApiResponse<any>> {
    return this.post('/equipment/customer-equipment', data);
  }

  async updateCustomerEquipment(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/equipment/customer-equipment/${id}`, data);
  }

  async deleteCustomerEquipment(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/equipment/customer-equipment/${id}`);
  }

  // Equipment Types methods
  async getEquipmentTypes(params?: any): Promise<ApiResponse<any>> {
    return this.get('/equipment/types', params);
  }

  async getEquipmentOptions(): Promise<ApiResponse<any>> {
    return this.get('/equipment/options');
  }

  // Jobs/Work Orders specific methods
  async getJobs(params?: any): Promise<ApiResponse<any>> {
    return this.get('/jobs', params);
  }

  async getJob(id: string): Promise<ApiResponse<any>> {
    return this.get(`/jobs/${id}`);
  }

  async createJob(data: any): Promise<ApiResponse<any>> {
    return this.post('/jobs', data);
  }

  async updateJob(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/jobs/${id}`, data);
  }

  async deleteJob(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/jobs/${id}`);
  }

  async updateJobStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return this.patch(`/jobs/${id}/status`, { status });
  }

  async getJobOptions(): Promise<ApiResponse<any>> {
    return this.get('/jobs/options');
  }

  async getCustomerEquipmentForJob(customerId: string): Promise<ApiResponse<any>> {
    return this.get(`/jobs/customer/${customerId}/equipment`);
  }

  // Search methods for job forms
  async searchTechnicians(search?: string): Promise<ApiResponse<any>> {
    return this.get('/jobs/search/technicians', { search, _t: Date.now() });
  }

  async searchCustomers(search?: string): Promise<ApiResponse<any>> {
    return this.get('/jobs/search/customers', { search });
  }

  async searchEquipment(search?: string, customerId?: string): Promise<ApiResponse<any>> {
    return this.get('/jobs/search/equipment', { search, customer_id: customerId });
  }

  // Dashboard specific methods
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.get('/dashboard/stats');
  }

  async getRecentActivities(limit?: number): Promise<ApiResponse<any>> {
    return this.get('/dashboard/activities', { limit });
  }

  // Password reset methods
  async initiatePasswordReset(email: string): Promise<ApiResponse<any>> {
    return this.post('/auth/reset-password', { email });
  }

  async completePasswordReset(token: string, newPassword: string): Promise<ApiResponse<any>> {
    return this.post('/auth/reset-password/confirm', { token, newPassword });
  }

  async adminInitiatePasswordReset(technicianId: string): Promise<ApiResponse<any>> {
    return this.post(`/auth/reset-password/admin/${technicianId}`);
  }

  async adminSetPassword(technicianId: string, newPassword: string): Promise<ApiResponse<any>> {
    return this.post(`/auth/set-password/admin/${technicianId}`, { newPassword });
  }

  // Mail settings methods
  async getMailSettings(): Promise<ApiResponse<any>> {
    return this.get('/settings/mail');
  }

  async updateMailSettings(settings: any): Promise<ApiResponse<any>> {
    return this.put('/settings/mail', settings);
  }

  async testMailSettings(testEmail: string): Promise<ApiResponse<any>> {
    return this.post('/settings/mail/test', { test_email: testEmail });
  }

  // Inventory specific methods
  async getInventoryOrders(params?: any): Promise<ApiResponse<any>> {
    return this.get('/inventory/orders', params);
  }

  async getInventoryItems(params?: any): Promise<ApiResponse<any>> {
    return this.get('/inventory', params);
  }

  async getLowStockAlerts(): Promise<ApiResponse<any>> {
    return this.get('/inventory/alerts');
  }

  async updateInventoryOrderStatus(orderId: string, status: string, notes?: string): Promise<ApiResponse<any>> {
    return this.patch(`/inventory/orders/${orderId}/status`, { status, notes });
  }

  async exportInventoryOrdersPDF(params?: any): Promise<Blob> {
    const response = await this.api.get('/inventory/orders/export/pdf', {
      params,
      responseType: 'blob',
    });

    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
