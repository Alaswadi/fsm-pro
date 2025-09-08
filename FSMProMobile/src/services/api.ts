import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ApiResponse, 
  LoginCredentials, 
  AuthResponse, 
  User, 
  Job, 
  Technician, 
  Customer, 
  Equipment, 
  InventoryItem,
  FileUploadResponse 
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use appropriate API URL based on platform
    if (__DEV__) {
      // Development environment
      if (typeof window !== 'undefined') {
        // Web environment
        this.baseURL = 'http://localhost:3001/api';
      } else {
        // Mobile environment (Android emulator)
        this.baseURL = 'http://10.0.2.2:3001/api';
      }
    } else {
      // Production environment
      this.baseURL = 'https://your-production-api.com/api';
    }

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // Increased timeout to 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('API Service initialized with baseURL:', this.baseURL);

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('fsm_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear storage and redirect to login
          await AsyncStorage.removeItem('fsm_token');
          await AsyncStorage.removeItem('fsm_user');
          // You can emit an event here to redirect to login
        }
        return Promise.reject(error);
      }
    );
  }

  // Helper method to handle API responses
  private handleResponse<T>(response: AxiosResponse): ApiResponse<T> {
    return response.data;
  }

  private handleError(error: any): ApiResponse {
    console.error('API Error:', error);
    console.error('API Base URL:', this.baseURL);

    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timeout - please check if the backend is running and accessible',
      };
    } else if (error.response) {
      return {
        success: false,
        error: error.response.data?.error || 'Server error occurred',
      };
    } else if (error.request) {
      return {
        success: false,
        error: `Network error - cannot connect to ${this.baseURL}. Please check if the backend is running.`,
      };
    } else {
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await this.api.post('/auth/login', credentials);
      const result = this.handleResponse<AuthResponse>(response);
      
      if (result.success && result.data) {
        // Store token and user data
        await AsyncStorage.setItem('fsm_token', result.data.token);
        await AsyncStorage.setItem('fsm_user', JSON.stringify(result.data.user));
      }
      
      return result;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      await this.api.post('/auth/logout');
      // Clear local storage
      await AsyncStorage.removeItem('fsm_token');
      await AsyncStorage.removeItem('fsm_user');
      return { success: true };
    } catch (error) {
      // Even if API call fails, clear local storage
      await AsyncStorage.removeItem('fsm_token');
      await AsyncStorage.removeItem('fsm_user');
      return { success: true };
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.get('/auth/profile');
      return this.handleResponse<User>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Job/Work Order endpoints
  async getJobs(params?: {
    status?: string;
    technician_id?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ jobs: Job[]; total: number; page: number; totalPages: number }>> {
    try {
      // For mobile app, we need to get the current technician's ID and filter jobs
      const currentTechnicianId = await this.getCurrentTechnicianId();

      const requestParams = {
        ...params,
        // Always filter by current technician for mobile app
        technician_id: currentTechnicianId || params?.technician_id,
      };

      const response = await this.api.get('/jobs', { params: requestParams });
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Helper method to get current technician ID
  private async getCurrentTechnicianId(): Promise<string | null> {
    try {
      const storedUser = await AsyncStorage.getItem('fsm_user');
      if (!storedUser) return null;

      const user = JSON.parse(storedUser);
      if (user.role !== 'technician') return null;

      // Get technician record for this user
      const techniciansResponse = await this.getTechnicians();
      if (techniciansResponse.success && techniciansResponse.data) {
        const technician = techniciansResponse.data.find(t => t.user_id === user.id);
        return technician?.id || null;
      }

      return null;
    } catch (error) {
      console.error('Error getting current technician ID:', error);
      return null;
    }
  }

  async getJob(id: string): Promise<ApiResponse<Job>> {
    try {
      const response = await this.api.get(`/jobs/${id}`);
      return this.handleResponse<Job>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateJobStatus(id: string, status: Job['status'], notes?: string): Promise<ApiResponse<Job>> {
    try {
      const response = await this.api.patch(`/jobs/${id}/status`, { status, notes });
      return this.handleResponse<Job>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateJob(id: string, data: Partial<Job>): Promise<ApiResponse<Job>> {
    try {
      const response = await this.api.put(`/jobs/${id}`, data);
      return this.handleResponse<Job>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Technician endpoints
  async getTechnicians(): Promise<ApiResponse<Technician[]>> {
    try {
      const response = await this.api.get('/technicians');
      return this.handleResponse<Technician[]>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateTechnicianStatus(id: string, status: 'available' | 'offline'): Promise<ApiResponse<Technician>> {
    try {
      const response = await this.api.patch(`/technicians/${id}/availability`, { status });
      return this.handleResponse<Technician>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Customer endpoints
  async getCustomers(): Promise<ApiResponse<Customer[]>> {
    try {
      const response = await this.api.get('/customers');
      return this.handleResponse<Customer[]>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    try {
      const response = await this.api.get(`/customers/${id}`);
      return this.handleResponse<Customer>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Equipment endpoints
  async getEquipment(): Promise<ApiResponse<Equipment[]>> {
    try {
      const response = await this.api.get('/equipment/customer-equipment');
      return this.handleResponse<Equipment[]>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getEquipmentById(id: string): Promise<ApiResponse<Equipment>> {
    try {
      const response = await this.api.get(`/equipment/customer-equipment/${id}`);
      return this.handleResponse<Equipment>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Inventory endpoints
  async getInventory(): Promise<ApiResponse<InventoryItem[]>> {
    try {
      const response = await this.api.get('/inventory');
      return this.handleResponse<InventoryItem[]>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // File upload endpoints
  async uploadFile(uri: string, type: 'equipment-image' | 'job-attachment'): Promise<ApiResponse<FileUploadResponse>> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      } as any);

      const response = await this.api.post(`/upload/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return this.handleResponse<FileUploadResponse>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/health');
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Password reset endpoints
  async initiatePasswordReset(email: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/auth/reset-password', { email });
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async completePasswordReset(token: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/auth/reset-password/confirm', {
        token,
        newPassword
      });
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const apiService = new ApiService();
export default apiService;
