import { PoolClient } from 'pg';
import { transaction, query } from '../config/database';
import { EquipmentRepairStatus, JobStatus } from '../types';

/**
 * Valid status transitions mapping
 * Each status can only transition to specific next statuses
 */
const STATUS_TRANSITIONS: Record<EquipmentRepairStatus, EquipmentRepairStatus[]> = {
  'pending_intake': ['in_transit', 'received'],
  'in_transit': ['received'],
  'received': ['in_repair'],
  'in_repair': ['repair_completed', 'received'], // Can go back if more work needed
  'repair_completed': ['ready_for_pickup', 'out_for_delivery'],
  'ready_for_pickup': ['returned'],
  'out_for_delivery': ['returned'],
  'returned': [] // Terminal state
};

/**
 * Mapping from equipment status to job status
 * Automatically updates job status based on equipment status
 */
const EQUIPMENT_TO_JOB_STATUS: Record<EquipmentRepairStatus, JobStatus> = {
  'pending_intake': 'pending',
  'in_transit': 'pending',
  'received': 'assigned',
  'in_repair': 'in_progress',
  'repair_completed': 'completed',
  'ready_for_pickup': 'completed',
  'out_for_delivery': 'completed',
  'returned': 'completed'
};

/**
 * Validate if a status transition is allowed
 */
export const validateStatusTransition = (
  currentStatus: EquipmentRepairStatus,
  newStatus: EquipmentRepairStatus
): { isValid: boolean; error?: string } => {
  // Check if current status exists in transition rules
  if (!STATUS_TRANSITIONS[currentStatus]) {
    return {
      isValid: false,
      error: `Invalid current status: ${currentStatus}`
    };
  }

  // Check if new status is in the allowed transitions
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions.includes(newStatus)) {
    return {
      isValid: false,
      error: `Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.join(', ') || 'none (terminal state)'}`
    };
  }

  return { isValid: true };
};

/**
 * Record status change in history table
 */
export const recordStatusHistory = async (
  client: PoolClient,
  equipmentStatusId: string,
  jobId: string,
  fromStatus: EquipmentRepairStatus | null,
  toStatus: EquipmentRepairStatus,
  changedBy?: string,
  notes?: string
): Promise<void> => {
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
    equipmentStatusId,
    jobId,
    fromStatus,
    toStatus,
    changedBy || null,
    notes || null
  ]);
};

/**
 * Update job status based on equipment status
 */
export const updateJobStatusFromEquipmentStatus = async (
  client: PoolClient,
  jobId: string,
  equipmentStatus: EquipmentRepairStatus
): Promise<void> => {
  const newJobStatus = EQUIPMENT_TO_JOB_STATUS[equipmentStatus];

  if (!newJobStatus) {
    console.warn(`No job status mapping for equipment status: ${equipmentStatus}`);
    return;
  }

  const updateJobQuery = `
    UPDATE jobs
    SET status = $1, updated_at = NOW()
    WHERE id = $2
  `;

  await client.query(updateJobQuery, [newJobStatus, jobId]);
};

/**
 * Update equipment status with validation and history tracking
 * Uses database transaction to ensure data consistency
 */
export const updateEquipmentStatus = async (
  jobId: string,
  newStatus: EquipmentRepairStatus,
  changedBy?: string,
  notes?: string
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    return await transaction(async (client: PoolClient) => {
      // 1. Get current equipment status
      const getCurrentStatusQuery = `
        SELECT id, current_status, company_id
        FROM equipment_status
        WHERE job_id = $1
      `;
      const statusResult = await client.query(getCurrentStatusQuery, [jobId]);

      if (statusResult.rows.length === 0) {
        return {
          success: false,
          error: 'Equipment status record not found for this job'
        };
      }

      const currentStatusRecord = statusResult.rows[0];
      const currentStatus = currentStatusRecord.current_status as EquipmentRepairStatus;
      const equipmentStatusId = currentStatusRecord.id;

      // 2. Validate status transition
      const validation = validateStatusTransition(currentStatus, newStatus);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // 3. Update equipment status record
      const statusTimestampField = `${newStatus}_at`;
      const updateStatusQuery = `
        UPDATE equipment_status
        SET 
          current_status = $1,
          ${statusTimestampField} = NOW(),
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const updateResult = await client.query(updateStatusQuery, [
        newStatus,
        equipmentStatusId
      ]);

      const updatedStatus = updateResult.rows[0];

      // 4. Record status history
      await recordStatusHistory(
        client,
        equipmentStatusId,
        jobId,
        currentStatus,
        newStatus,
        changedBy,
        notes
      );

      // 5. Update job status based on equipment status
      await updateJobStatusFromEquipmentStatus(client, jobId, newStatus);

      return {
        success: true,
        data: updatedStatus
      };
    });
  } catch (error: any) {
    console.error('Error updating equipment status:', error);
    return {
      success: false,
      error: error.message || 'Failed to update equipment status'
    };
  }
};
