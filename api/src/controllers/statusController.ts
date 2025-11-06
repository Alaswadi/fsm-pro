import { Response } from 'express';
import { query } from '../config/database';
import { ApiResponse, AuthRequest, EquipmentRepairStatus } from '../types';
import { updateEquipmentStatus } from '../services/statusService';
import { sendStatusUpdate } from '../services/workshopNotificationService';

/**
 * Get current equipment status for a job
 * GET /api/workshop/status/:job_id
 */
export const getEquipmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { job_id } = req.params;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Fetch equipment status with job details
    const statusQuery = `
      SELECT
        es.*,
        j.job_number,
        j.title as job_title,
        j.location_type,
        j.status as job_status
      FROM equipment_status es
      JOIN jobs j ON es.job_id = j.id
      WHERE es.job_id = $1 AND es.company_id = $2
    `;
    const result = await query(statusQuery, [job_id, companyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Equipment status not found for this job'
      } as ApiResponse);
    }

    const status = result.rows[0];

    res.json({
      success: true,
      data: status
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching equipment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch equipment status'
    } as ApiResponse);
  }
};

/**
 * Update equipment status with transition validation
 * PUT /api/workshop/status/:job_id
 */
export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { job_id } = req.params;
    const { status, notes } = req.body;
    const companyId = req.company?.id;
    const userId = req.user?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      } as ApiResponse);
    }

    // Validate status value
    const validStatuses: EquipmentRepairStatus[] = [
      'pending_intake',
      'in_transit',
      'received',
      'in_repair',
      'repair_completed',
      'ready_for_pickup',
      'out_for_delivery',
      'returned'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      } as ApiResponse);
    }

    // Verify job exists and belongs to company
    const jobCheckQuery = `
      SELECT id, location_type, company_id
      FROM jobs
      WHERE id = $1 AND company_id = $2
    `;
    const jobResult = await query(jobCheckQuery, [job_id, companyId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      } as ApiResponse);
    }

    const job = jobResult.rows[0];
    if (job.location_type !== 'workshop') {
      return res.status(400).json({
        success: false,
        error: 'Can only update status for workshop jobs'
      } as ApiResponse);
    }

    // Update equipment status using service
    const result = await updateEquipmentStatus(
      job_id,
      status as EquipmentRepairStatus,
      userId,
      notes
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      } as ApiResponse);
    }

    // Send status update notification
    try {
      await sendStatusUpdate(job_id, companyId, status, notes);
    } catch (notificationError) {
      console.error('Failed to send status update notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Fetch updated status with relations
    const updatedStatusQuery = `
      SELECT
        es.*,
        j.job_number,
        j.title as job_title,
        j.status as job_status
      FROM equipment_status es
      JOIN jobs j ON es.job_id = j.id
      WHERE es.job_id = $1
    `;
    const updatedResult = await query(updatedStatusQuery, [job_id]);

    res.json({
      success: true,
      data: updatedResult.rows[0],
      message: 'Equipment status updated successfully'
    } as ApiResponse);

  } catch (error: any) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update equipment status'
    } as ApiResponse);
  }
};

/**
 * Get status history for a job
 * GET /api/workshop/status/:job_id/history
 */
export const getStatusHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { job_id } = req.params;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Verify job exists and belongs to company
    const jobCheckQuery = `
      SELECT id, company_id
      FROM jobs
      WHERE id = $1 AND company_id = $2
    `;
    const jobResult = await query(jobCheckQuery, [job_id, companyId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      } as ApiResponse);
    }

    // Fetch status history with user details
    const historyQuery = `
      SELECT
        esh.*,
        u.full_name as changed_by_name,
        u.email as changed_by_email
      FROM equipment_status_history esh
      LEFT JOIN users u ON esh.changed_by = u.id
      WHERE esh.job_id = $1
      ORDER BY esh.changed_at DESC
    `;
    const result = await query(historyQuery, [job_id]);

    const history = result.rows.map(record => ({
      ...record,
      changed_by_user: record.changed_by_name ? {
        id: record.changed_by,
        full_name: record.changed_by_name,
        email: record.changed_by_email
      } : null
    }));

    res.json({
      success: true,
      data: history
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching status history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status history'
    } as ApiResponse);
  }
};
