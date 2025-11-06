import { Response } from 'express';
import { query } from '../config/database';
import { ApiResponse, AuthRequest } from '../types';
import { claimJobFromQueue } from '../services/workshopService';
import { updateEquipmentStatus } from '../services/statusService';
import { sendReadyNotification, sendDeliveryNotification } from '../services/workshopNotificationService';
import { getWorkshopMetrics as getMetrics } from '../services/workshopMetricsService';
import { getCapacityUtilization } from '../services/capacityService';
import { updateJobTotal } from '../services/invoiceService';

// Get all workshop jobs with filtering
export const getWorkshopJobs = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      equipment_status,
      customer_id,
      date_from,
      date_to
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    const companyId = req.company?.id;
    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Build WHERE conditions - always filter for workshop jobs
    let whereConditions = ['j.company_id = $1', "j.location_type = 'workshop'"];
    let queryParams: any[] = [companyId];
    let paramIndex = 2;

    if (search) {
      whereConditions.push(`(j.job_number ILIKE $${paramIndex} OR j.title ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`j.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (priority) {
      whereConditions.push(`j.priority = $${paramIndex}`);
      queryParams.push(priority);
      paramIndex++;
    }

    if (equipment_status) {
      whereConditions.push(`es.current_status = $${paramIndex}`);
      queryParams.push(equipment_status);
      paramIndex++;
    }

    if (customer_id) {
      whereConditions.push(`j.customer_id = $${paramIndex}`);
      queryParams.push(customer_id);
      paramIndex++;
    }

    if (date_from) {
      whereConditions.push(`j.created_at >= $${paramIndex}`);
      queryParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereConditions.push(`j.created_at <= $${paramIndex}`);
      queryParams.push(date_to);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN equipment_status es ON j.id = es.job_id
      WHERE ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    // Get workshop jobs with related data
    const jobsQuery = `
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
        ei.reported_issue,
        ei.intake_date
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN technicians t ON j.technician_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      LEFT JOIN customer_equipment ce ON j.equipment_id = ce.id
      LEFT JOIN equipment_types et ON ce.equipment_type_id = et.id
      LEFT JOIN equipment_status es ON j.id = es.job_id
      LEFT JOIN equipment_intake ei ON j.id = ei.job_id
      WHERE ${whereClause}
      ORDER BY j.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(Number(limit), offset);
    const jobsResult = await query(jobsQuery, queryParams);

    const jobs = jobsResult.rows.map(row => ({
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
        company_name: row.customer_company
      } : null,
      technician: row.technician_name ? {
        id: row.technician_id,
        employee_id: row.technician_employee_id,
        user: {
          full_name: row.technician_name,
          phone: row.technician_phone,
          email: row.technician_email
        }
      } : null,
      equipment: row.equipment_serial ? {
        id: row.equipment_id,
        serial_number: row.equipment_serial,
        equipment_type: {
          name: row.equipment_name,
          brand: row.equipment_brand,
          model: row.equipment_model
        }
      } : null,
      equipment_status: row.equipment_status_id ? {
        id: row.equipment_status_id,
        current_status: row.equipment_status,
        received_at: row.received_at,
        in_repair_at: row.in_repair_at,
        repair_completed_at: row.repair_completed_at
      } : null,
      intake: row.intake_date ? {
        reported_issue: row.reported_issue,
        intake_date: row.intake_date
      } : null
    }));

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching workshop jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workshop jobs'
    } as ApiResponse);
  }
};

// Get workshop queue (jobs with received or in_repair status)
export const getWorkshopQueue = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      equipment_type,
      customer_id,
      priority,
      sort_by = 'priority' // priority, intake_date, estimated_completion
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    const companyId = req.company?.id;
    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Build WHERE conditions - filter for workshop jobs in queue
    let whereConditions = [
      'j.company_id = $1',
      "j.location_type = 'workshop'",
      "es.current_status IN ('received', 'in_repair')"
    ];
    let queryParams: any[] = [companyId];
    let paramIndex = 2;

    if (equipment_type) {
      whereConditions.push(`et.name = $${paramIndex}`);
      queryParams.push(equipment_type);
      paramIndex++;
    }

    if (customer_id) {
      whereConditions.push(`j.customer_id = $${paramIndex}`);
      queryParams.push(customer_id);
      paramIndex++;
    }

    if (priority) {
      whereConditions.push(`j.priority = $${paramIndex}`);
      queryParams.push(priority);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Determine sort order
    let orderByClause = 'j.created_at DESC';
    if (sort_by === 'priority') {
      orderByClause = `
        CASE j.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        EXTRACT(EPOCH FROM (NOW() - ei.intake_date)) DESC,
        CASE WHEN j.estimated_completion_date < NOW() THEN 0 ELSE 1 END
      `;
    } else if (sort_by === 'intake_date') {
      orderByClause = 'ei.intake_date ASC';
    } else if (sort_by === 'estimated_completion') {
      orderByClause = 'j.estimated_completion_date ASC NULLS LAST';
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM jobs j
      LEFT JOIN equipment_status es ON j.id = es.job_id
      LEFT JOIN equipment_intake ei ON j.id = ei.job_id
      LEFT JOIN customer_equipment ce ON j.equipment_id = ce.id
      LEFT JOIN equipment_types et ON ce.equipment_type_id = et.id
      WHERE ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    // Get queue items with priority calculation
    const queueQuery = `
      SELECT
        j.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        t.employee_id as technician_employee_id,
        tu.full_name as technician_name,
        ce.serial_number as equipment_serial,
        et.name as equipment_name,
        et.brand as equipment_brand,
        et.model as equipment_model,
        es.id as equipment_status_id,
        es.current_status as equipment_status,
        es.received_at,
        es.in_repair_at,
        ei.id as intake_id,
        ei.reported_issue,
        ei.intake_date,
        ei.visual_condition,
        ei.estimated_repair_time,
        EXTRACT(EPOCH FROM (NOW() - ei.intake_date)) / 86400 as days_waiting,
        CASE WHEN j.estimated_completion_date < NOW() THEN true ELSE false END as is_overdue
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN technicians t ON j.technician_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      LEFT JOIN customer_equipment ce ON j.equipment_id = ce.id
      LEFT JOIN equipment_types et ON ce.equipment_type_id = et.id
      LEFT JOIN equipment_status es ON j.id = es.job_id
      LEFT JOIN equipment_intake ei ON j.id = ei.job_id
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(Number(limit), offset);
    const queueResult = await query(queueQuery, queryParams);

    const queueItems = queueResult.rows.map(row => ({
      id: row.id,
      job_number: row.job_number,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      estimated_completion_date: row.estimated_completion_date,
      days_waiting: Math.floor(row.days_waiting || 0),
      is_overdue: row.is_overdue,
      technician_id: row.technician_id,
      customer: {
        id: row.customer_id,
        name: row.customer_name,
        phone: row.customer_phone,
        email: row.customer_email
      },
      technician: row.technician_name ? {
        id: row.technician_id,
        employee_id: row.technician_employee_id,
        user: {
          full_name: row.technician_name
        }
      } : null,
      equipment: row.equipment_serial ? {
        id: row.equipment_id,
        serial_number: row.equipment_serial,
        equipment_type: {
          name: row.equipment_name,
          brand: row.equipment_brand,
          model: row.equipment_model
        }
      } : null,
      equipment_status: {
        id: row.equipment_status_id,
        current_status: row.equipment_status,
        received_at: row.received_at,
        in_repair_at: row.in_repair_at
      },
      equipment_intake: row.intake_id ? {
        id: row.intake_id,
        reported_issue: row.reported_issue,
        intake_date: row.intake_date,
        visual_condition: row.visual_condition,
        estimated_repair_time: row.estimated_repair_time
      } : null
    }));

    // Get capacity metrics
    const capacityMetrics = await getCapacityUtilization(companyId);

    res.json({
      success: true,
      data: {
        jobs: queueItems,
        capacity_utilization: capacityMetrics.workshop.utilization_percentage,
        current_jobs: capacityMetrics.workshop.current_jobs,
        max_jobs: capacityMetrics.workshop.max_concurrent_jobs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching workshop queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workshop queue'
    } as ApiResponse);
  }
};

// Claim job from queue (assign technician)
export const claimJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { technician_id } = req.body;

    const companyId = req.company?.id;
    const userId = req.user?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    if (!technician_id) {
      return res.status(400).json({
        success: false,
        error: 'Technician ID is required'
      } as ApiResponse);
    }

    // Use workshop service to claim job with capacity validation
    const result = await claimJobFromQueue(id, technician_id, companyId, userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Job claimed successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error claiming job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim job'
    } as ApiResponse);
  }
};

// Mark equipment as ready for pickup
export const markReadyForPickup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notify_customer = true } = req.body;

    const companyId = req.company?.id;
    const userId = req.user?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Verify job exists and is a workshop job
    const jobQuery = `
      SELECT j.*, es.current_status as equipment_status
      FROM jobs j
      LEFT JOIN equipment_status es ON j.id = es.job_id
      WHERE j.id = $1 AND j.company_id = $2
    `;
    const jobResult = await query(jobQuery, [id, companyId]);

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
        error: 'Job is not a workshop job'
      } as ApiResponse);
    }

    // Update equipment status to ready_for_pickup
    const statusResult = await updateEquipmentStatus(
      id,
      'ready_for_pickup',
      userId,
      'Equipment marked as ready for pickup'
    );

    if (!statusResult.success) {
      return res.status(400).json({
        success: false,
        error: statusResult.error
      } as ApiResponse);
    }

    // Send ready-for-pickup notification if requested
    if (notify_customer) {
      try {
        await sendReadyNotification(id, companyId);
      } catch (notificationError) {
        console.error('Failed to send ready-for-pickup notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    res.json({
      success: true,
      data: {
        job_id: id,
        equipment_status: statusResult.data,
        notification_sent: notify_customer
      },
      message: 'Equipment marked as ready for pickup'
    } as ApiResponse);

  } catch (error) {
    console.error('Error marking equipment ready for pickup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark equipment ready for pickup'
    } as ApiResponse);
  }
};

// Schedule delivery for equipment return
export const scheduleDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { delivery_date, delivery_technician_id, delivery_fee } = req.body;

    const companyId = req.company?.id;
    const userId = req.user?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Validate required fields
    if (!delivery_date || !delivery_technician_id) {
      return res.status(400).json({
        success: false,
        error: 'Delivery date and technician are required'
      } as ApiResponse);
    }

    // Verify job exists and is a workshop job
    const jobQuery = `
      SELECT j.*, es.current_status as equipment_status
      FROM jobs j
      LEFT JOIN equipment_status es ON j.id = es.job_id
      WHERE j.id = $1 AND j.company_id = $2
    `;
    const jobResult = await query(jobQuery, [id, companyId]);

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
        error: 'Job is not a workshop job'
      } as ApiResponse);
    }

    // Verify technician exists and belongs to company
    const technicianQuery = `
      SELECT t.id
      FROM technicians t
      WHERE t.id = $1 AND t.company_id = $2
    `;
    const technicianResult = await query(technicianQuery, [delivery_technician_id, companyId]);

    if (technicianResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found or does not belong to your company'
      } as ApiResponse);
    }

    // Update job with delivery details
    const updateJobQuery = `
      UPDATE jobs
      SET 
        delivery_scheduled_date = $1,
        delivery_technician_id = $2,
        pickup_delivery_fee = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const updateResult = await query(updateJobQuery, [
      delivery_date,
      delivery_technician_id,
      delivery_fee || 0,
      id
    ]);

    // Update equipment status to out_for_delivery
    const statusResult = await updateEquipmentStatus(
      id,
      'out_for_delivery',
      userId,
      `Delivery scheduled for ${delivery_date}`
    );

    if (!statusResult.success) {
      return res.status(400).json({
        success: false,
        error: statusResult.error
      } as ApiResponse);
    }

    // Send delivery notification
    try {
      await sendDeliveryNotification(id, companyId);
    } catch (notificationError) {
      console.error('Failed to send delivery notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      data: {
        job: updateResult.rows[0],
        equipment_status: statusResult.data
      },
      message: 'Delivery scheduled successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error scheduling delivery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule delivery'
    } as ApiResponse);
  }
};

// Mark equipment as returned with customer signature
export const markEquipmentReturned = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { customer_signature, return_notes } = req.body;

    const companyId = req.company?.id;
    const userId = req.user?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Validate required fields
    if (!customer_signature) {
      return res.status(400).json({
        success: false,
        error: 'Customer signature is required'
      } as ApiResponse);
    }

    // Verify job exists and is a workshop job
    const jobQuery = `
      SELECT j.*, es.current_status as equipment_status, ei.id as intake_id
      FROM jobs j
      LEFT JOIN equipment_status es ON j.id = es.job_id
      LEFT JOIN equipment_intake ei ON j.id = ei.job_id
      WHERE j.id = $1 AND j.company_id = $2
    `;
    const jobResult = await query(jobQuery, [id, companyId]);

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
        error: 'Job is not a workshop job'
      } as ApiResponse);
    }

    if (!job.intake_id) {
      return res.status(400).json({
        success: false,
        error: 'No intake record found for this job'
      } as ApiResponse);
    }

    // Update intake record with customer signature and return notes
    const updateIntakeQuery = `
      UPDATE equipment_intake
      SET 
        customer_signature = $1,
        internal_notes = CASE 
          WHEN internal_notes IS NULL THEN $2
          ELSE internal_notes || E'\n\nReturn Notes: ' || $2
        END,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    await query(updateIntakeQuery, [
      customer_signature,
      return_notes || 'Equipment returned to customer',
      job.intake_id
    ]);

    // Update equipment status to returned
    const statusResult = await updateEquipmentStatus(
      id,
      'returned',
      userId,
      return_notes || 'Equipment returned to customer'
    );

    if (!statusResult.success) {
      return res.status(400).json({
        success: false,
        error: statusResult.error
      } as ApiResponse);
    }

    // Calculate and update job total cost (parts + delivery fee)
    // This makes the job ready for invoicing
    let totalCost = 0;
    try {
      totalCost = await updateJobTotal(id);
    } catch (totalError) {
      console.error('Failed to calculate job total:', totalError);
      // Don't fail the request if total calculation fails
    }

    res.json({
      success: true,
      data: {
        job_id: id,
        equipment_status: statusResult.data,
        returned_at: statusResult.data.returned_at,
        total_cost: totalCost
      },
      message: 'Equipment marked as returned and job total calculated'
    } as ApiResponse);

  } catch (error) {
    console.error('Error marking equipment as returned:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark equipment as returned'
    } as ApiResponse);
  }
};

// Get workshop metrics with date range filtering
export const getWorkshopMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const { date_from, date_to } = req.query;

    const companyId = req.company?.id;
    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Validate date format if provided
    if (date_from && isNaN(Date.parse(date_from as string))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date_from format. Use ISO 8601 format (YYYY-MM-DD)'
      } as ApiResponse);
    }

    if (date_to && isNaN(Date.parse(date_to as string))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date_to format. Use ISO 8601 format (YYYY-MM-DD)'
      } as ApiResponse);
    }

    // Get all metrics
    const metrics = await getMetrics(
      companyId,
      date_from as string | undefined,
      date_to as string | undefined
    );

    res.json({
      success: true,
      data: metrics,
      message: 'Workshop metrics retrieved successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching workshop metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workshop metrics'
    } as ApiResponse);
  }
};

// Get workshop capacity utilization
export const getWorkshopCapacity = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.company?.id;
    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    const capacityUtilization = await getCapacityUtilization(companyId);

    // Determine if warnings should be displayed
    const workshopWarning = capacityUtilization.workshop.utilization_percentage >= 80;
    const technicianWarnings = capacityUtilization.technicians
      .filter(t => t.utilization_percentage >= 80)
      .map(t => ({
        technician_id: t.technician_id,
        technician_name: t.technician_name,
        utilization_percentage: t.utilization_percentage
      }));

    res.json({
      success: true,
      data: {
        ...capacityUtilization,
        warnings: {
          workshop_approaching_capacity: workshopWarning,
          technicians_approaching_capacity: technicianWarnings
        }
      },
      message: 'Workshop capacity retrieved successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching workshop capacity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workshop capacity'
    } as ApiResponse);
  }
};
