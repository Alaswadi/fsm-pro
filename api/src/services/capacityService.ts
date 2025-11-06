import { query } from '../config/database';

interface CapacityCheckResult {
  isValid: boolean;
  error?: string;
  currentCount?: number;
  maxCapacity?: number;
}

interface CapacityUtilization {
  workshop: {
    current_jobs: number;
    max_concurrent_jobs: number;
    utilization_percentage: number;
    available_capacity: number;
  };
  technicians: Array<{
    technician_id: string;
    technician_name: string;
    current_jobs: number;
    max_jobs: number;
    utilization_percentage: number;
    available_capacity: number;
  }>;
}

/**
 * Check if workshop has capacity for new jobs
 * Validates against max_concurrent_jobs setting
 */
export const checkWorkshopCapacity = async (
  companyId: string
): Promise<CapacityCheckResult> => {
  try {
    // Get workshop settings for capacity limits
    const settingsQuery = `
      SELECT max_concurrent_jobs
      FROM workshop_settings
      WHERE company_id = $1
    `;
    const settingsResult = await query(settingsQuery, [companyId]);

    if (settingsResult.rows.length === 0) {
      // No settings found, allow job creation (no limit)
      return { isValid: true };
    }

    const maxConcurrentJobs = settingsResult.rows[0].max_concurrent_jobs;

    // Count current active workshop jobs (not returned or cancelled)
    const activeJobsQuery = `
      SELECT COUNT(*) as active_count
      FROM jobs j
      LEFT JOIN equipment_status es ON j.id = es.job_id
      WHERE j.company_id = $1
        AND j.location_type = 'workshop'
        AND j.status != 'cancelled'
        AND (es.current_status IS NULL OR es.current_status != 'returned')
    `;
    const activeJobsResult = await query(activeJobsQuery, [companyId]);
    const activeCount = parseInt(activeJobsResult.rows[0].active_count);

    if (activeCount >= maxConcurrentJobs) {
      return {
        isValid: false,
        error: `Workshop has reached maximum capacity (${maxConcurrentJobs} jobs). Current active jobs: ${activeCount}`,
        currentCount: activeCount,
        maxCapacity: maxConcurrentJobs
      };
    }

    return {
      isValid: true,
      currentCount: activeCount,
      maxCapacity: maxConcurrentJobs
    };
  } catch (error) {
    console.error('Error checking workshop capacity:', error);
    throw new Error('Failed to check workshop capacity');
  }
};

/**
 * Check if technician has capacity for additional jobs
 * Validates against max_jobs_per_technician setting
 */
export const checkTechnicianCapacity = async (
  technicianId: string,
  companyId: string
): Promise<CapacityCheckResult> => {
  try {
    // Get workshop settings for capacity limits
    const settingsQuery = `
      SELECT max_jobs_per_technician
      FROM workshop_settings
      WHERE company_id = $1
    `;
    const settingsResult = await query(settingsQuery, [companyId]);

    if (settingsResult.rows.length === 0) {
      // No settings found, allow job assignment (no limit)
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
    const activeJobsResult = await query(activeJobsQuery, [technicianId, companyId]);
    const activeCount = parseInt(activeJobsResult.rows[0].active_count);

    if (activeCount >= maxJobsPerTechnician) {
      return {
        isValid: false,
        error: `Technician has reached maximum capacity (${maxJobsPerTechnician} jobs). Current active jobs: ${activeCount}`,
        currentCount: activeCount,
        maxCapacity: maxJobsPerTechnician
      };
    }

    return {
      isValid: true,
      currentCount: activeCount,
      maxCapacity: maxJobsPerTechnician
    };
  } catch (error) {
    console.error('Error checking technician capacity:', error);
    throw new Error('Failed to check technician capacity');
  }
};

/**
 * Get comprehensive capacity utilization for workshop and all technicians
 * Returns current usage, limits, and available capacity
 */
export const getCapacityUtilization = async (
  companyId: string
): Promise<CapacityUtilization> => {
  try {
    // Get workshop settings
    const settingsQuery = `
      SELECT max_concurrent_jobs, max_jobs_per_technician
      FROM workshop_settings
      WHERE company_id = $1
    `;
    const settingsResult = await query(settingsQuery, [companyId]);

    const maxConcurrentJobs = settingsResult.rows[0]?.max_concurrent_jobs || 20;
    const maxJobsPerTechnician = settingsResult.rows[0]?.max_jobs_per_technician || 5;

    // Get workshop-wide active job count
    const workshopJobsQuery = `
      SELECT COUNT(*) as active_count
      FROM jobs j
      LEFT JOIN equipment_status es ON j.id = es.job_id
      WHERE j.company_id = $1
        AND j.location_type = 'workshop'
        AND j.status != 'cancelled'
        AND (es.current_status IS NULL OR es.current_status != 'returned')
    `;
    const workshopJobsResult = await query(workshopJobsQuery, [companyId]);
    const workshopActiveJobs = parseInt(workshopJobsResult.rows[0].active_count);

    const workshopUtilization = maxConcurrentJobs > 0 
      ? (workshopActiveJobs / maxConcurrentJobs) * 100 
      : 0;

    // Get per-technician capacity utilization
    const technicianCapacityQuery = `
      SELECT 
        t.id as technician_id,
        u.full_name as technician_name,
        COUNT(j.id) as active_jobs
      FROM technicians t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN jobs j ON j.technician_id = t.id 
        AND j.location_type = 'workshop'
        AND j.status IN ('assigned', 'in_progress')
        AND j.company_id = $1
      WHERE t.company_id = $1
        AND t.is_available = true
      GROUP BY t.id, u.full_name
      ORDER BY active_jobs DESC, u.full_name ASC
    `;
    const technicianCapacityResult = await query(technicianCapacityQuery, [companyId]);

    const technicians = technicianCapacityResult.rows.map((row: any) => {
      const currentJobs = parseInt(row.active_jobs);
      const utilizationPercentage = maxJobsPerTechnician > 0 
        ? (currentJobs / maxJobsPerTechnician) * 100 
        : 0;

      return {
        technician_id: row.technician_id,
        technician_name: row.technician_name,
        current_jobs: currentJobs,
        max_jobs: maxJobsPerTechnician,
        utilization_percentage: Math.round(utilizationPercentage * 100) / 100,
        available_capacity: Math.max(0, maxJobsPerTechnician - currentJobs)
      };
    });

    return {
      workshop: {
        current_jobs: workshopActiveJobs,
        max_concurrent_jobs: maxConcurrentJobs,
        utilization_percentage: Math.round(workshopUtilization * 100) / 100,
        available_capacity: Math.max(0, maxConcurrentJobs - workshopActiveJobs)
      },
      technicians
    };
  } catch (error) {
    console.error('Error getting capacity utilization:', error);
    throw new Error('Failed to get capacity utilization');
  }
};
