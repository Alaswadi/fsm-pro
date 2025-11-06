import { apiService } from './api';
import type { ApiResponse } from '../types';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  type: 'labor' | 'part' | 'fee';
}

export interface InvoiceData {
  job_id: string;
  job_number: string;
  location_type: 'on_site' | 'workshop';
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_amount?: number;
  total: number;
  customer_info: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company_name?: string;
    billing_address?: string;
  };
  job_info: {
    title: string;
    description: string;
    completed_at?: string;
    technician_name?: string;
  };
}

export interface JobReadyCheck {
  ready: boolean;
  reason?: string;
}

/**
 * Get invoice data for a specific job
 */
export const getJobInvoice = async (jobId: string): Promise<InvoiceData> => {
  const response = await apiService.get<InvoiceData>(`/invoices/job/${jobId}`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to get invoice data');
};

/**
 * Calculate and update job total cost
 */
export const calculateJobTotal = async (jobId: string): Promise<{ job_id: string; total_cost: number }> => {
  const response = await apiService.post<{ job_id: string; total_cost: number }>(`/invoices/job/${jobId}/calculate`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to calculate job total');
};

/**
 * Check if a job is ready for invoicing
 */
export const checkJobInvoiceReady = async (jobId: string): Promise<JobReadyCheck> => {
  const response = await apiService.get<JobReadyCheck>(`/invoices/job/${jobId}/ready`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to check invoice readiness');
};

/**
 * Get list of jobs ready for invoicing
 */
export const getJobsReadyForInvoicing = async (page: number = 1, limit: number = 20) => {
  const response = await apiService.get<any>('/invoices/ready', { page, limit });
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to get jobs ready for invoicing');
};
