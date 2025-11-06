import { PoolClient } from 'pg';
import { transaction, query } from '../config/database';
import { EquipmentIntake, EquipmentRepairStatus } from '../types';

interface CreateIntakeData {
  job_id: string;
  company_id: string;
  received_by?: string;
  reported_issue: string;
  visual_condition?: string;
  physical_damage_notes?: string;
  accessories_included?: string;
  customer_signature?: string;
  customer_notes?: string;
  internal_notes?: string;
  estimated_repair_time?: number;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate intake data before creating record
 */
export const validateIntakeData = (data: CreateIntakeData): ValidationResult => {
  // Required fields
  if (!data.job_id) {
    return { isValid: false, error: 'Job ID is required' };
  }

  if (!data.company_id) {
    return { isValid: false, error: 'Company ID is required' };
  }

  if (!data.reported_issue || data.reported_issue.trim().length === 0) {
    return { isValid: false, error: 'Reported issue is required' };
  }

  // Validate estimated repair time if provided
  if (data.estimated_repair_time !== undefined && data.estimated_repair_time < 0) {
    return { isValid: false, error: 'Estimated repair time must be a positive number' };
  }

  return { isValid: true };
};

/**
 * Calculate estimated completion date based on equipment type and repair time
 */
export const calculateEstimatedCompletion = async (
  jobId: string,
  estimatedRepairHours?: number
): Promise<Date> => {
  try {
    // Get workshop settings for default repair time
    const settingsQuery = `
      SELECT ws.default_estimated_repair_hours
      FROM workshop_settings ws
      JOIN jobs j ON j.company_id = ws.company_id
      WHERE j.id = $1
    `;
    const settingsResult = await query(settingsQuery, [jobId]);
    
    const defaultHours = settingsResult.rows.length > 0 
      ? settingsResult.rows[0].default_estimated_repair_hours 
      : 24;

    // Use provided estimate or default
    const hoursToAdd = estimatedRepairHours || defaultHours;

    // Calculate completion date (current time + estimated hours)
    const completionDate = new Date();
    completionDate.setHours(completionDate.getHours() + hoursToAdd);

    return completionDate;
  } catch (error) {
    console.error('Error calculating estimated completion:', error);
    // Fallback to 24 hours from now
    const fallbackDate = new Date();
    fallbackDate.setHours(fallbackDate.getHours() + 24);
    return fallbackDate;
  }
};

/**
 * Create equipment intake record with status initialization
 * Uses database transaction to ensure data consistency
 */
export const createIntakeRecord = async (
  data: CreateIntakeData
): Promise<EquipmentIntake> => {
  // Validate data first
  const validation = validateIntakeData(data);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  return await transaction(async (client: PoolClient) => {
    // 1. Verify job exists and is a workshop job
    const jobCheckQuery = `
      SELECT id, location_type, company_id
      FROM jobs
      WHERE id = $1 AND company_id = $2
    `;
    const jobResult = await client.query(jobCheckQuery, [data.job_id, data.company_id]);

    if (jobResult.rows.length === 0) {
      throw new Error('Job not found or does not belong to this company');
    }

    const job = jobResult.rows[0];
    if (job.location_type !== 'workshop') {
      throw new Error('Job must be a workshop job to create intake record');
    }

    // 2. Check if intake record already exists
    const existingIntakeQuery = `
      SELECT id FROM equipment_intake WHERE job_id = $1
    `;
    const existingIntake = await client.query(existingIntakeQuery, [data.job_id]);

    if (existingIntake.rows.length > 0) {
      throw new Error('Intake record already exists for this job');
    }

    // 3. Calculate estimated completion date
    const estimatedCompletion = await calculateEstimatedCompletion(
      data.job_id,
      data.estimated_repair_time
    );

    // 4. Create intake record
    const insertIntakeQuery = `
      INSERT INTO equipment_intake (
        job_id,
        company_id,
        received_by,
        reported_issue,
        visual_condition,
        physical_damage_notes,
        accessories_included,
        customer_signature,
        customer_notes,
        internal_notes,
        estimated_repair_time,
        intake_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;

    const intakeValues = [
      data.job_id,
      data.company_id,
      data.received_by || null,
      data.reported_issue,
      data.visual_condition || null,
      data.physical_damage_notes || null,
      data.accessories_included || null,
      data.customer_signature || null,
      data.customer_notes || null,
      data.internal_notes || null,
      data.estimated_repair_time || null
    ];

    const intakeResult = await client.query(insertIntakeQuery, intakeValues);
    const intake = intakeResult.rows[0];

    // 5. Initialize or update equipment status to 'received'
    const statusCheckQuery = `
      SELECT id FROM equipment_status WHERE job_id = $1
    `;
    const statusCheck = await client.query(statusCheckQuery, [data.job_id]);

    if (statusCheck.rows.length === 0) {
      // Create new equipment status
      const insertStatusQuery = `
        INSERT INTO equipment_status (
          job_id,
          company_id,
          current_status,
          received_at
        ) VALUES ($1, $2, $3, NOW())
        RETURNING *
      `;
      await client.query(insertStatusQuery, [
        data.job_id,
        data.company_id,
        'received' as EquipmentRepairStatus
      ]);
    } else {
      // Update existing status to 'received'
      const updateStatusQuery = `
        UPDATE equipment_status
        SET current_status = $1, received_at = NOW(), updated_at = NOW()
        WHERE job_id = $2
      `;
      await client.query(updateStatusQuery, ['received', data.job_id]);
    }

    // 6. Record status history
    const statusId = statusCheck.rows.length > 0 
      ? statusCheck.rows[0].id 
      : (await client.query('SELECT id FROM equipment_status WHERE job_id = $1', [data.job_id])).rows[0].id;

    const insertHistoryQuery = `
      INSERT INTO equipment_status_history (
        equipment_status_id,
        job_id,
        from_status,
        to_status,
        changed_by,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await client.query(insertHistoryQuery, [
      statusId,
      data.job_id,
      statusCheck.rows.length > 0 ? 'pending_intake' : null,
      'received',
      data.received_by || null,
      'Equipment received at workshop during intake'
    ]);

    // 7. Update job with estimated completion date
    const updateJobQuery = `
      UPDATE jobs
      SET estimated_completion_date = $1, updated_at = NOW()
      WHERE id = $2
    `;
    await client.query(updateJobQuery, [estimatedCompletion, data.job_id]);

    return intake;
  });
};
