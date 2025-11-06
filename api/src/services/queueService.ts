import { query } from '../config/database';
import { Job, EquipmentIntake, EquipmentStatus, JobPriority } from '../types';

export interface QueueItem {
  job: Job;
  equipment_status: EquipmentStatus;
  intake: EquipmentIntake;
  priority_score: number;
  days_waiting: number;
  is_overdue: boolean;
}

export interface QueueFilters {
  equipment_type?: string;
  customer_id?: string;
  priority?: JobPriority;
}

/**
 * Calculate priority score for queue sorting
 * Score = priority weight + days waiting + overdue bonus
 */
export const calculatePriorityScore = (
  priority: JobPriority,
  intakeDate: Date,
  estimatedCompletionDate?: Date
): number => {
  let score = 0;

  // Priority weight (higher priority = higher score)
  const priorityWeights: Record<JobPriority, number> = {
    urgent: 100,
    high: 75,
    medium: 50,
    low: 25
  };
  score += priorityWeights[priority] || 0;

  // Days waiting weight (1 point per day)
  const now = new Date();
  const daysWaiting = Math.floor((now.getTime() - new Date(intakeDate).getTime()) / (1000 * 60 * 60 * 24));
  score += daysWaiting;

  // Overdue weight (50 points if past estimated completion)
  if (estimatedCompletionDate) {
    const isOverdue = new Date(estimatedCompletionDate) < now;
    if (isOverdue) {
      score += 50;
    }
  }

  return score;
};

/**
 * Sort queue items by priority score (highest first)
 */
export const sortQueueByPriority = (items: QueueItem[]): QueueItem[] => {
  return items.sort((a, b) => b.priority_score - a.priority_score);
};

/**
 * Get workshop queue with priority calculation and filtering
 * Returns jobs with status 'received' or 'in_repair'
 */
export const getWorkshopQueue = async (
  companyId: string,
  filters: QueueFilters = {}
): Promise<QueueItem[]> => {
  try {
    // Build WHERE conditions - filter for workshop jobs in queue
    const whereConditions = [
      'j.company_id = $1',
      "j.location_type = 'workshop'",
      "es.current_status IN ('received', 'in_repair')"
    ];
    const queryParams: any[] = [companyId];
    let paramIndex = 2;

    if (filters.equipment_type) {
      whereConditions.push(`et.name = $${paramIndex}`);
      queryParams.push(filters.equipment_type);
      paramIndex++;
    }

    if (filters.customer_id) {
      whereConditions.push(`j.customer_id = $${paramIndex}`);
      queryParams.push(filters.customer_id);
      paramIndex++;
    }

    if (filters.priority) {
      whereConditions.push(`j.priority = $${paramIndex}`);
      queryParams.push(filters.priority);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get queue items with all necessary data
    const queueQuery = `
      SELECT
        j.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.company_name as customer_company,
        t.employee_id as technician_employee_id,
        tu.full_name as technician_name,
        tu.phone as technician_phone,
        tu.email as technician_email,
        ce.serial_number as equipment_serial,
        et.name as equipment_name,
        et.brand as equipment_brand,
        et.model as equipment_model,
        es.id as equipment_status_id,
        es.current_status as equipment_status,
        es.received_at,
        es.in_repair_at,
        es.repair_completed_at,
        ei.id as intake_id,
        ei.reported_issue,
        ei.intake_date,
        ei.visual_condition,
        ei.physical_damage_notes,
        ei.accessories_included,
        ei.estimated_repair_time,
        ei.received_by as intake_received_by
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN technicians t ON j.technician_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      LEFT JOIN customer_equipment ce ON j.equipment_id = ce.id
      LEFT JOIN equipment_types et ON ce.equipment_type_id = et.id
      INNER JOIN equipment_status es ON j.id = es.job_id
      INNER JOIN equipment_intake ei ON j.id = ei.job_id
      WHERE ${whereClause}
      ORDER BY j.created_at DESC
    `;

    const result = await query(queueQuery, queryParams);

    // Transform results into QueueItem objects with priority calculation
    const queueItems: QueueItem[] = result.rows.map((row: any) => {
      const intakeDate = new Date(row.intake_date);
      const estimatedCompletionDate = row.estimated_completion_date 
        ? new Date(row.estimated_completion_date) 
        : undefined;

      const priorityScore = calculatePriorityScore(
        row.priority,
        intakeDate,
        estimatedCompletionDate
      );

      const now = new Date();
      const daysWaiting = Math.floor((now.getTime() - intakeDate.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = estimatedCompletionDate ? estimatedCompletionDate < now : false;

      const job: Job = {
        id: row.id,
        company_id: row.company_id,
        customer_id: row.customer_id,
        equipment_id: row.equipment_id,
        technician_id: row.technician_id,
        job_number: row.job_number,
        title: row.title,
        description: row.description,
        priority: row.priority,
        status: row.status,
        scheduled_date: row.scheduled_date,
        due_date: row.due_date,
        started_at: row.started_at,
        completed_at: row.completed_at,
        estimated_duration: row.estimated_duration,
        actual_duration: row.actual_duration,
        location_type: row.location_type,
        estimated_completion_date: row.estimated_completion_date,
        pickup_delivery_fee: row.pickup_delivery_fee,
        delivery_scheduled_date: row.delivery_scheduled_date,
        delivery_technician_id: row.delivery_technician_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        customer: row.customer_name ? {
          id: row.customer_id,
          name: row.customer_name,
          phone: row.customer_phone,
          email: row.customer_email,
          company_name: row.customer_company,
          address: '',
          is_active: true,
          created_at: '',
          updated_at: '',
          company_id: row.company_id
        } : undefined,
        technician: row.technician_name ? {
          id: row.technician_id,
          employee_id: row.technician_employee_id,
          user: {
            id: '',
            full_name: row.technician_name,
            phone: row.technician_phone,
            email: row.technician_email,
            role: 'technician',
            is_active: true,
            created_at: '',
            updated_at: ''
          },
          company_id: row.company_id,
          user_id: '',
          skills: [],
          certifications: [],
          is_available: true,
          max_jobs_per_day: 0,
          created_at: '',
          updated_at: ''
        } : undefined
      };

      const equipment_status: EquipmentStatus = {
        id: row.equipment_status_id,
        job_id: row.id,
        company_id: row.company_id,
        current_status: row.equipment_status,
        received_at: row.received_at,
        in_repair_at: row.in_repair_at,
        repair_completed_at: row.repair_completed_at,
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      const intake: EquipmentIntake = {
        id: row.intake_id,
        job_id: row.id,
        company_id: row.company_id,
        intake_date: row.intake_date,
        received_by: row.intake_received_by,
        reported_issue: row.reported_issue,
        visual_condition: row.visual_condition,
        physical_damage_notes: row.physical_damage_notes,
        accessories_included: row.accessories_included,
        estimated_repair_time: row.estimated_repair_time,
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      return {
        job,
        equipment_status,
        intake,
        priority_score: priorityScore,
        days_waiting: daysWaiting,
        is_overdue: isOverdue
      };
    });

    // Sort by priority score
    return sortQueueByPriority(queueItems);

  } catch (error) {
    console.error('Error fetching workshop queue:', error);
    throw new Error('Failed to fetch workshop queue');
  }
};
