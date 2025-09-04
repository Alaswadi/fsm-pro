import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, LoginCredentials, User } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    console.log('API Base URL:', baseURL);

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
}

export const apiService = new ApiService();
export default apiService;
