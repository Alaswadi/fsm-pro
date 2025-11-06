import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import { 
  getInvoiceData, 
  updateJobTotal, 
  isJobReadyForInvoicing,
  calculateJobTotal 
} from '../services/invoiceService';

/**
 * Get invoice data for a job
 * GET /api/invoices/job/:job_id
 */
export const getJobInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { job_id } = req.params;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Check if job is ready for invoicing
    const readyCheck = await isJobReadyForInvoicing(job_id);
    
    if (!readyCheck.ready) {
      return res.status(400).json({
        success: false,
        error: readyCheck.reason || 'Job is not ready for invoicing'
      } as ApiResponse);
    }

    // Get invoice data
    const invoiceData = await getInvoiceData(job_id, companyId);

    res.json({
      success: true,
      data: invoiceData
    } as ApiResponse);

  } catch (error) {
    console.error('Error getting job invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job invoice'
    } as ApiResponse);
  }
};

/**
 * Calculate and update job total cost
 * POST /api/invoices/job/:job_id/calculate
 */
export const calculateAndUpdateJobTotal = async (req: AuthRequest, res: Response) => {
  try {
    const { job_id } = req.params;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Verify job belongs to company
    const { query } = await import('../config/database');
    const jobCheck = await query(
      'SELECT id FROM jobs WHERE id = $1 AND company_id = $2',
      [job_id, companyId]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      } as ApiResponse);
    }

    // Calculate and update total
    const total = await updateJobTotal(job_id);

    res.json({
      success: true,
      data: {
        job_id,
        total_cost: total
      },
      message: 'Job total calculated and updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error calculating job total:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate job total'
    } as ApiResponse);
  }
};

/**
 * Check if job is ready for invoicing
 * GET /api/invoices/job/:job_id/ready
 */
export const checkJobInvoiceReady = async (req: AuthRequest, res: Response) => {
  try {
    const { job_id } = req.params;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Verify job belongs to company
    const { query } = await import('../config/database');
    const jobCheck = await query(
      'SELECT id FROM jobs WHERE id = $1 AND company_id = $2',
      [job_id, companyId]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      } as ApiResponse);
    }

    const readyCheck = await isJobReadyForInvoicing(job_id);

    res.json({
      success: true,
      data: readyCheck
    } as ApiResponse);

  } catch (error) {
    console.error('Error checking invoice readiness:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check invoice readiness'
    } as ApiResponse);
  }
};

/**
 * Get list of jobs ready for invoicing
 * GET /api/invoices/ready
 */
export const getJobsReadyForInvoicing = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.company?.id;
    const { page = 1, limit = 20 } = req.query;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { query } = await import('../config/database');

    // Get completed jobs
    // For workshop jobs, also check that equipment is returned
    const jobsQuery = `
      SELECT 
        j.id,
        j.job_number,
        j.title,
        j.location_type,
        j.completed_at,
        j.total_cost,
        c.name as customer_name,
        c.company_name as customer_company,
        es.current_status as equipment_status
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN equipment_status es ON j.id = es.job_id
      WHERE j.company_id = $1 
        AND j.status = 'completed'
        AND (
          j.location_type = 'on_site' 
          OR (j.location_type = 'workshop' AND es.current_status = 'returned')
        )
      ORDER BY j.completed_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(jobsQuery, [companyId, Number(limit), offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM jobs j
      LEFT JOIN equipment_status es ON j.id = es.job_id
      WHERE j.company_id = $1 
        AND j.status = 'completed'
        AND (
          j.location_type = 'on_site' 
          OR (j.location_type = 'workshop' AND es.current_status = 'returned')
        )
    `;

    const countResult = await query(countQuery, [companyId]);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        jobs: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error getting jobs ready for invoicing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get jobs ready for invoicing'
    } as ApiResponse);
  }
};
