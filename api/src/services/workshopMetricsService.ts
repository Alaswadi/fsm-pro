import { query } from '../config/database';
import { EquipmentRepairStatus, WorkshopMetrics } from '../types';

/**
 * Calculate average repair time for completed workshop jobs
 * Repair time = time from received_at to repair_completed_at
 */
export const calculateAverageRepairTime = async (
  companyId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<number> => {
  try {
    let whereConditions = [
      'j.company_id = $1',
      "j.location_type = 'workshop'",
      "es.received_at IS NOT NULL",
      "es.repair_completed_at IS NOT NULL"
    ];
    const queryParams: any[] = [companyId];
    let paramIndex = 2;

    if (dateFrom) {
      whereConditions.push(`es.received_at >= $${paramIndex}`);
      queryParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereConditions.push(`es.received_at <= $${paramIndex}`);
      queryParams.push(dateTo);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const avgQuery = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (es.repair_completed_at - es.received_at)) / 3600) as avg_hours
      FROM jobs j
      INNER JOIN equipment_status es ON j.id = es.job_id
      WHERE ${whereClause}
    `;

    const result = await query(avgQuery, queryParams);
    const avgHours = result.rows[0]?.avg_hours;

    return avgHours ? parseFloat(avgHours) : 0;
  } catch (error) {
    console.error('Error calculating average repair time:', error);
    throw new Error('Failed to calculate average repair time');
  }
};

/**
 * Get count of jobs by equipment status
 */
export const getJobsByStatus = async (
  companyId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<Record<EquipmentRepairStatus, number>> => {
  try {
    let whereConditions = [
      'j.company_id = $1',
      "j.location_type = 'workshop'"
    ];
    const queryParams: any[] = [companyId];
    let paramIndex = 2;

    if (dateFrom) {
      whereConditions.push(`j.created_at >= $${paramIndex}`);
      queryParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereConditions.push(`j.created_at <= $${paramIndex}`);
      queryParams.push(dateTo);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const statusQuery = `
      SELECT 
        es.current_status,
        COUNT(*) as count
      FROM jobs j
      LEFT JOIN equipment_status es ON j.id = es.job_id
      WHERE ${whereClause}
      GROUP BY es.current_status
    `;

    const result = await query(statusQuery, queryParams);

    // Initialize all statuses with 0
    const jobsByStatus: Record<EquipmentRepairStatus, number> = {
      pending_intake: 0,
      in_transit: 0,
      received: 0,
      in_repair: 0,
      repair_completed: 0,
      ready_for_pickup: 0,
      out_for_delivery: 0,
      returned: 0
    };

    // Fill in actual counts
    result.rows.forEach((row: any) => {
      if (row.current_status) {
        jobsByStatus[row.current_status as EquipmentRepairStatus] = parseInt(row.count);
      }
    });

    return jobsByStatus;
  } catch (error) {
    console.error('Error getting jobs by status:', error);
    throw new Error('Failed to get jobs by status');
  }
};

/**
 * Calculate on-time completion rate
 * On-time = repair_completed_at <= estimated_completion_date
 */
export const calculateOnTimeCompletionRate = async (
  companyId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<number> => {
  try {
    let whereConditions = [
      'j.company_id = $1',
      "j.location_type = 'workshop'",
      "es.repair_completed_at IS NOT NULL",
      "j.estimated_completion_date IS NOT NULL"
    ];
    const queryParams: any[] = [companyId];
    let paramIndex = 2;

    if (dateFrom) {
      whereConditions.push(`es.repair_completed_at >= $${paramIndex}`);
      queryParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereConditions.push(`es.repair_completed_at <= $${paramIndex}`);
      queryParams.push(dateTo);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const rateQuery = `
      SELECT 
        COUNT(*) as total_completed,
        SUM(CASE WHEN es.repair_completed_at <= j.estimated_completion_date THEN 1 ELSE 0 END) as on_time_count
      FROM jobs j
      INNER JOIN equipment_status es ON j.id = es.job_id
      WHERE ${whereClause}
    `;

    const result = await query(rateQuery, queryParams);
    const totalCompleted = parseInt(result.rows[0]?.total_completed || '0');
    const onTimeCount = parseInt(result.rows[0]?.on_time_count || '0');

    if (totalCompleted === 0) {
      return 0;
    }

    return (onTimeCount / totalCompleted) * 100;
  } catch (error) {
    console.error('Error calculating on-time completion rate:', error);
    throw new Error('Failed to calculate on-time completion rate');
  }
};

/**
 * Get workshop capacity utilization
 * Utilization = (active jobs / max concurrent jobs) * 100
 */
export const getWorkshopUtilization = async (
  companyId: string
): Promise<number> => {
  try {
    // Get workshop settings for max capacity
    const settingsQuery = `
      SELECT max_concurrent_jobs
      FROM workshop_settings
      WHERE company_id = $1
    `;
    const settingsResult = await query(settingsQuery, [companyId]);
    const maxConcurrentJobs = settingsResult.rows[0]?.max_concurrent_jobs || 20;

    // Get count of active workshop jobs (not returned or cancelled)
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
    const activeJobs = parseInt(activeJobsResult.rows[0]?.active_count || '0');

    if (maxConcurrentJobs === 0) {
      return 0;
    }

    return (activeJobs / maxConcurrentJobs) * 100;
  } catch (error) {
    console.error('Error calculating workshop utilization:', error);
    throw new Error('Failed to calculate workshop utilization');
  }
};

/**
 * Get active jobs count per technician
 */
export const getJobsPerTechnician = async (
  companyId: string
): Promise<Array<{ technician_id: string; technician_name: string; active_jobs: number }>> => {
  try {
    const jobsQuery = `
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

    const result = await query(jobsQuery, [companyId]);

    return result.rows.map((row: any) => ({
      technician_id: row.technician_id,
      technician_name: row.technician_name,
      active_jobs: parseInt(row.active_jobs)
    }));
  } catch (error) {
    console.error('Error getting jobs per technician:', error);
    throw new Error('Failed to get jobs per technician');
  }
};

/**
 * Get all workshop metrics in a single call
 */
export const getWorkshopMetrics = async (
  companyId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<WorkshopMetrics> => {
  try {
    const [
      averageRepairTime,
      jobsByStatus,
      onTimeCompletionRate,
      capacityUtilization,
      jobsPerTechnician
    ] = await Promise.all([
      calculateAverageRepairTime(companyId, dateFrom, dateTo),
      getJobsByStatus(companyId, dateFrom, dateTo),
      calculateOnTimeCompletionRate(companyId, dateFrom, dateTo),
      getWorkshopUtilization(companyId),
      getJobsPerTechnician(companyId)
    ]);

    // Calculate total jobs from jobsByStatus
    const totalJobs = Object.values(jobsByStatus).reduce((sum, count) => sum + count, 0);

    return {
      total_jobs: totalJobs,
      jobs_by_status: jobsByStatus,
      average_repair_time_hours: Math.round(averageRepairTime * 100) / 100, // Round to 2 decimals
      on_time_completion_rate: Math.round(onTimeCompletionRate * 100) / 100, // Round to 2 decimals
      current_capacity_utilization: Math.round(capacityUtilization * 100) / 100, // Round to 2 decimals
      jobs_per_technician: jobsPerTechnician
    };
  } catch (error) {
    console.error('Error getting workshop metrics:', error);
    throw new Error('Failed to get workshop metrics');
  }
};
