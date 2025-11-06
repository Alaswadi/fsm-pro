import { PoolClient } from 'pg';
import { transaction, query } from '../config/database';
import { updateEquipmentStatus } from './statusService';

interface ClaimJobResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Validate technician capacity before claiming a job
 * Checks if technician has reached max_jobs_per_technician limit
 */
const validateTechnicianCapacity = async (
  client: PoolClient,
  technicianId: string,
  companyId: string
): Promise<{ isValid: boolean; error?: string }> => {
  try {
    // Get workshop settings for capacity limits
    const settingsQuery = `
      SELECT max_jobs_per_technician
      FROM workshop_settings
      WHERE company_id = $1
    `;
    const settingsResult = await client.query(settingsQuery, [companyId]);

    if (settingsResult.rows.length === 0) {
      // No settings found, allow claim (no limit)
      return { isValid: true };
    }

    const maxJobsPerTechnician = settingsResult.rows[0].max_jobs_per_technician;

    // Count current active workshop jobs for this technician
    const activeJobsQuery = `
      SELECT COUNT(*) as active_count
      FROM jobs j
      INNER JOIN equipment_status es ON j.id = es.job_id
      WHERE j.technician_id = $1
        AND j.company_id = $2
        AND j.location_type = 'workshop'
        AND es.current_status IN ('in_repair', 'repair_completed')
        AND j.status NOT IN ('completed', 'cancelled')
    `;
    const activeJobsResult = await client.query(activeJobsQuery, [technicianId, companyId]);
    const activeCount = parseInt(activeJobsResult.rows[0].active_count);

    if (activeCount >= maxJobsPerTechnician) {
      return {
        isValid: false,
        error: `Technician has reached maximum capacity (${maxJobsPerTechnician} jobs). Current active jobs: ${activeCount}`
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating technician capacity:', error);
    return {
      isValid: false,
      error: 'Failed to validate technician capacity'
    };
  }
};

/**
 * Claim a job from the workshop queue
 * - Assigns technician to job
 * - Updates equipment status to 'in_repair'
 * - Updates job status to 'in_progress'
 * - Validates technician capacity before claiming
 */
export const claimJobFromQueue = async (
  jobId: string,
  technicianId: string,
  companyId: string,
  userId?: string
): Promise<ClaimJobResult> => {
  try {
    return await transaction(async (client: PoolClient) => {
      // 1. Verify job exists and is a workshop job
      const jobCheckQuery = `
        SELECT j.*, es.current_status as equipment_status
        FROM jobs j
        LEFT JOIN equipment_status es ON j.id = es.job_id
        WHERE j.id = $1 AND j.company_id = $2 AND j.location_type = 'workshop'
      `;
      const jobResult = await client.query(jobCheckQuery, [jobId, companyId]);

      if (jobResult.rows.length === 0) {
        return {
          success: false,
          error: 'Workshop job not found'
        };
      }

      const job = jobResult.rows[0];

      // 2. Check if job is already assigned
      if (job.technician_id) {
        return {
          success: false,
          error: 'Job is already assigned to a technician'
        };
      }

      // 3. Check if equipment is in correct status (received)
      if (job.equipment_status !== 'received') {
        return {
          success: false,
          error: `Cannot claim job. Equipment status must be 'received', current status is '${job.equipment_status}'`
        };
      }

      // 4. Verify technician exists and belongs to company
      const technicianCheckQuery = `
        SELECT id FROM technicians
        WHERE id = $1 AND company_id = $2
      `;
      const technicianResult = await client.query(technicianCheckQuery, [technicianId, companyId]);

      if (technicianResult.rows.length === 0) {
        return {
          success: false,
          error: 'Invalid technician ID or technician does not belong to this company'
        };
      }

      // 5. Validate technician capacity
      const capacityValidation = await validateTechnicianCapacity(client, technicianId, companyId);
      if (!capacityValidation.isValid) {
        return {
          success: false,
          error: capacityValidation.error
        };
      }

      // 6. Update job with technician assignment and status
      const updateJobQuery = `
        UPDATE jobs
        SET 
          technician_id = $1,
          status = 'in_progress',
          started_at = NOW(),
          updated_at = NOW()
        WHERE id = $2 AND company_id = $3
        RETURNING *
      `;
      const updateJobResult = await client.query(updateJobQuery, [technicianId, jobId, companyId]);
      const updatedJob = updateJobResult.rows[0];

      // 7. Update equipment status to 'in_repair'
      const updateStatusQuery = `
        UPDATE equipment_status
        SET 
          current_status = 'in_repair',
          in_repair_at = NOW(),
          updated_at = NOW()
        WHERE job_id = $1
        RETURNING *
      `;
      await client.query(updateStatusQuery, [jobId]);

      // 8. Record status history
      const statusIdQuery = `
        SELECT id FROM equipment_status WHERE job_id = $1
      `;
      const statusIdResult = await client.query(statusIdQuery, [jobId]);

      if (statusIdResult.rows.length > 0) {
        const equipmentStatusId = statusIdResult.rows[0].id;
        
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
          'received',
          'in_repair',
          userId || null,
          'Job claimed by technician from workshop queue'
        ]);
      }

      // 9. Fetch complete updated job data with relations
      const fetchJobQuery = `
        SELECT 
          j.*,
          c.name as customer_name,
          t.employee_id as technician_employee_id,
          tu.full_name as technician_name,
          tu.email as technician_email,
          tu.phone as technician_phone,
          es.current_status as equipment_status,
          es.in_repair_at
        FROM jobs j
        LEFT JOIN customers c ON j.customer_id = c.id
        LEFT JOIN technicians t ON j.technician_id = t.id
        LEFT JOIN users tu ON t.user_id = tu.id
        LEFT JOIN equipment_status es ON j.id = es.job_id
        WHERE j.id = $1
      `;
      const finalJobResult = await client.query(fetchJobQuery, [jobId]);
      const finalJob = finalJobResult.rows[0];

      return {
        success: true,
        data: {
          id: finalJob.id,
          job_number: finalJob.job_number,
          title: finalJob.title,
          status: finalJob.status,
          started_at: finalJob.started_at,
          technician: {
            id: finalJob.technician_id,
            employee_id: finalJob.technician_employee_id,
            user: {
              full_name: finalJob.technician_name,
              email: finalJob.technician_email,
              phone: finalJob.technician_phone
            }
          },
          equipment_status: finalJob.equipment_status,
          in_repair_at: finalJob.in_repair_at
        }
      };
    });
  } catch (error: any) {
    console.error('Error claiming job from queue:', error);
    return {
      success: false,
      error: error.message || 'Failed to claim job from queue'
    };
  }
};
