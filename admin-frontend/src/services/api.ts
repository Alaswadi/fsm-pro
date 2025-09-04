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
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('fsm_token');
          localStorage.removeItem('fsm_user');
          window.location.href = '/login';
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
}

export const apiService = new ApiService();
export default apiService;
