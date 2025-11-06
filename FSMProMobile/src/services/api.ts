import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
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
  FileUploadResponse,
  EquipmentIntake,
  EquipmentStatus,
  EquipmentStatusHistory
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use appropriate API URL based on platform
    if (__DEV__) {
      // Development environment
      if (Platform.OS === 'web') {
        // Web environment
        this.baseURL = 'http://localhost:3001/api';
      } else {
        // Mobile environment (iOS/Android) - use network IP for physical device/emulator on network
        this.baseURL = 'http://192.168.0.59:3001/api';
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
    customer_id?: string;
    location_type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ jobs: Job[]; total: number; page: number; totalPages: number }>> {
    try {
      // For mobile app, we need to get the current technician's ID and filter jobs
      const currentTechnicianId = await this.getCurrentTechnicianId();

      const requestParams = {
        ...params,
        // Always filter by current technician for mobile app (unless customer_id is provided)
        technician_id: params?.customer_id ? undefined : (currentTechnicianId || params?.technician_id),
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
        // API returns {technicians, pagination}, not a direct array
        const technicians = (techniciansResponse.data as any).technicians || techniciansResponse.data;
        const technician = Array.isArray(technicians)
          ? technicians.find((t: any) => t.user_id === user.id)
          : null;
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

  async createJob(data: {
    customer_id: string;
    equipment_id?: string;
    technician_id: string;
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    scheduled_date: string;
    due_date: string;
    estimated_duration?: number;
  }): Promise<ApiResponse<Job>> {
    try {
      const response = await this.api.post('/jobs', data);
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

  async processInventoryOrder(data: {
    work_order_id: string;
    items: Array<{ item_id: string; quantity: number }>;
  }): Promise<ApiResponse<{
    work_order_id: string;
    order_summary: {
      total_items: number;
      items: Array<{
        item_id: string;
        item_name: string;
        quantity_ordered: number;
        previous_stock: number;
        new_stock: number;
      }>;
    };
    message: string;
  }>> {
    try {
      const response = await this.api.post('/inventory/order', data);
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get ordered equipment for a work order
  async getWorkOrderInventoryOrders(workOrderId: string): Promise<ApiResponse<{
    orders: Array<{
      id: string;
      work_order_id: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      ordered_at: string;
      status: string;
      notes?: string;
      part_id: string;
      part_number: string;
      part_name: string;
      part_description?: string;
      category: string;
      current_unit_price: number;
      current_stock: number;
      ordered_by_name: string;
      ordered_by_email: string;
    }>;
    summary: {
      total_orders: number;
      total_items: number;
      total_value: number;
      status_breakdown: Record<string, number>;
    };
  }>> {
    try {
      const response = await this.api.get(`/inventory/work-orders/${workOrderId}/orders`);
      return this.handleResponse(response);
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

  // Workshop endpoints
  async getCustomerWorkshopJobs(customerId: string): Promise<ApiResponse<Job[]>> {
    try {
      const response = await this.api.get(`/workshop/customer/${customerId}/jobs`);
      return this.handleResponse<Job[]>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getWorkshopJobDetails(jobId: string): Promise<ApiResponse<Job>> {
    try {
      const response = await this.api.get(`/workshop/jobs/${jobId}`);
      return this.handleResponse<Job>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getWorkshopQueue(params?: {
    sort_by?: string;
    equipment_type?: string;
    priority?: string;
  }): Promise<ApiResponse<Job[]>> {
    try {
      const response = await this.api.get('/workshop/queue', { params });
      return this.handleResponse<Job[]>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async claimWorkshopJob(jobId: string): Promise<ApiResponse<Job>> {
    try {
      const response = await this.api.post(`/workshop/jobs/${jobId}/claim`);
      return this.handleResponse<Job>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getEquipmentIntake(jobId: string): Promise<ApiResponse<EquipmentIntake>> {
    try {
      const response = await this.api.get(`/workshop/intake/${jobId}`);
      return this.handleResponse<EquipmentIntake>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getEquipmentStatus(jobId: string): Promise<ApiResponse<EquipmentStatus>> {
    try {
      const response = await this.api.get(`/workshop/status/${jobId}`);
      return this.handleResponse<EquipmentStatus>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getEquipmentStatusHistory(jobId: string): Promise<ApiResponse<EquipmentStatusHistory[]>> {
    try {
      const response = await this.api.get(`/workshop/status/${jobId}/history`);
      return this.handleResponse<EquipmentStatusHistory[]>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateEquipmentStatus(jobId: string, status: string, notes?: string): Promise<ApiResponse<EquipmentStatus>> {
    try {
      const response = await this.api.put(`/workshop/status/${jobId}`, { status, notes });
      return this.handleResponse<EquipmentStatus>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const apiService = new ApiService();
export default apiService;
