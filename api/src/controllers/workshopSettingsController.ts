import { Response } from 'express';
import { query } from '../config/database';
import { ApiResponse, WorkshopSettings, AuthRequest } from '../types';

// Get workshop settings for the company
export const getWorkshopSettings = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    const settingsQuery = `
      SELECT * FROM workshop_settings
      WHERE company_id = $1
    `;

    const result = await query(settingsQuery, [companyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Workshop settings not found for this company'
      } as ApiResponse);
    }

    const settings: WorkshopSettings = result.rows[0];

    res.json({
      success: true,
      data: settings
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching workshop settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workshop settings'
    } as ApiResponse);
  }
};

// Update workshop settings
export const updateWorkshopSettings = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    const {
      max_concurrent_jobs,
      max_jobs_per_technician,
      default_estimated_repair_hours,
      default_pickup_delivery_fee,
      workshop_address,
      workshop_phone,
      workshop_hours,
      send_intake_confirmation,
      send_ready_notification,
      send_status_updates,
      intake_confirmation_template,
      ready_notification_template,
      status_update_template
    } = req.body;

    // Validate numeric fields
    if (max_concurrent_jobs !== undefined) {
      if (typeof max_concurrent_jobs !== 'number' || max_concurrent_jobs < 1) {
        return res.status(400).json({
          success: false,
          error: 'max_concurrent_jobs must be a positive number'
        } as ApiResponse);
      }
    }

    if (max_jobs_per_technician !== undefined) {
      if (typeof max_jobs_per_technician !== 'number' || max_jobs_per_technician < 1) {
        return res.status(400).json({
          success: false,
          error: 'max_jobs_per_technician must be a positive number'
        } as ApiResponse);
      }
    }

    if (default_estimated_repair_hours !== undefined) {
      if (typeof default_estimated_repair_hours !== 'number' || default_estimated_repair_hours < 1) {
        return res.status(400).json({
          success: false,
          error: 'default_estimated_repair_hours must be a positive number'
        } as ApiResponse);
      }
    }

    if (default_pickup_delivery_fee !== undefined) {
      if (typeof default_pickup_delivery_fee !== 'number' || default_pickup_delivery_fee < 0) {
        return res.status(400).json({
          success: false,
          error: 'default_pickup_delivery_fee must be a non-negative number'
        } as ApiResponse);
      }
    }

    // Validate boolean fields
    if (send_intake_confirmation !== undefined && typeof send_intake_confirmation !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'send_intake_confirmation must be a boolean'
      } as ApiResponse);
    }

    if (send_ready_notification !== undefined && typeof send_ready_notification !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'send_ready_notification must be a boolean'
      } as ApiResponse);
    }

    if (send_status_updates !== undefined && typeof send_status_updates !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'send_status_updates must be a boolean'
      } as ApiResponse);
    }

    // Check if settings exist for this company
    const existingSettings = await query(
      'SELECT id FROM workshop_settings WHERE company_id = $1',
      [companyId]
    );

    if (existingSettings.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Workshop settings not found for this company'
      } as ApiResponse);
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (max_concurrent_jobs !== undefined) {
      updateFields.push(`max_concurrent_jobs = $${paramIndex}`);
      updateValues.push(max_concurrent_jobs);
      paramIndex++;
    }

    if (max_jobs_per_technician !== undefined) {
      updateFields.push(`max_jobs_per_technician = $${paramIndex}`);
      updateValues.push(max_jobs_per_technician);
      paramIndex++;
    }

    if (default_estimated_repair_hours !== undefined) {
      updateFields.push(`default_estimated_repair_hours = $${paramIndex}`);
      updateValues.push(default_estimated_repair_hours);
      paramIndex++;
    }

    if (default_pickup_delivery_fee !== undefined) {
      updateFields.push(`default_pickup_delivery_fee = $${paramIndex}`);
      updateValues.push(default_pickup_delivery_fee);
      paramIndex++;
    }

    if (workshop_address !== undefined) {
      updateFields.push(`workshop_address = $${paramIndex}`);
      updateValues.push(workshop_address);
      paramIndex++;
    }

    if (workshop_phone !== undefined) {
      updateFields.push(`workshop_phone = $${paramIndex}`);
      updateValues.push(workshop_phone);
      paramIndex++;
    }

    if (workshop_hours !== undefined) {
      updateFields.push(`workshop_hours = $${paramIndex}`);
      updateValues.push(JSON.stringify(workshop_hours));
      paramIndex++;
    }

    if (send_intake_confirmation !== undefined) {
      updateFields.push(`send_intake_confirmation = $${paramIndex}`);
      updateValues.push(send_intake_confirmation);
      paramIndex++;
    }

    if (send_ready_notification !== undefined) {
      updateFields.push(`send_ready_notification = $${paramIndex}`);
      updateValues.push(send_ready_notification);
      paramIndex++;
    }

    if (send_status_updates !== undefined) {
      updateFields.push(`send_status_updates = $${paramIndex}`);
      updateValues.push(send_status_updates);
      paramIndex++;
    }

    if (intake_confirmation_template !== undefined) {
      updateFields.push(`intake_confirmation_template = $${paramIndex}`);
      updateValues.push(intake_confirmation_template);
      paramIndex++;
    }

    if (ready_notification_template !== undefined) {
      updateFields.push(`ready_notification_template = $${paramIndex}`);
      updateValues.push(ready_notification_template);
      paramIndex++;
    }

    if (status_update_template !== undefined) {
      updateFields.push(`status_update_template = $${paramIndex}`);
      updateValues.push(status_update_template);
      paramIndex++;
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length === 1) { // Only updated_at field
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      } as ApiResponse);
    }

    // Add WHERE clause parameter
    updateValues.push(companyId);

    const updateQuery = `
      UPDATE workshop_settings
      SET ${updateFields.join(', ')}
      WHERE company_id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    const updatedSettings: WorkshopSettings = result.rows[0];

    res.json({
      success: true,
      data: updatedSettings,
      message: 'Workshop settings updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating workshop settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workshop settings'
    } as ApiResponse);
  }
};
