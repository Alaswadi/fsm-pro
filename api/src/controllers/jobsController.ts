import { Request, Response } from 'express';
import { query } from '../config/database';
import { ApiResponse, Job, JobStatus, JobPriority, AuthRequest } from '../types';

// Get all jobs/work orders with pagination and filtering
export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      technician_id,
      customer_id,
      equipment_id,
      date_from,
      date_to
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    // Get company ID from request context
    const companyId = req.company?.id;
    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found. User must be associated with a company.'
      } as ApiResponse);
    }

    // Build WHERE conditions
    let whereConditions = ['j.company_id = $1'];
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

    if (technician_id) {
      whereConditions.push(`j.technician_id = $${paramIndex}`);
      queryParams.push(technician_id);
      paramIndex++;
    }

    if (customer_id) {
      whereConditions.push(`j.customer_id = $${paramIndex}`);
      queryParams.push(customer_id);
      paramIndex++;
    }

    if (equipment_id) {
      whereConditions.push(`j.equipment_id = $${paramIndex}`);
      queryParams.push(equipment_id);
      paramIndex++;
    }

    if (date_from) {
      whereConditions.push(`j.scheduled_date >= $${paramIndex}`);
      queryParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereConditions.push(`j.scheduled_date <= $${paramIndex}`);
      queryParams.push(date_to);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      WHERE ${whereClause}
    `;
    
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    // Get jobs with related data
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
        et.model as equipment_model
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN technicians t ON j.technician_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      LEFT JOIN customer_equipment ce ON j.equipment_id = ce.id
      LEFT JOIN equipment_types et ON ce.equipment_type_id = et.id
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
      customer_signature: row.customer_signature,
      technician_notes: row.technician_notes,
      customer_feedback: row.customer_feedback,
      rating: row.rating,
      total_cost: row.total_cost,
      created_by: row.created_by,
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
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs'
    } as ApiResponse);
  }
};

// Get single job by ID
export const getJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    const jobQuery = `
      SELECT
        j.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.company_name as customer_company,
        c.address as customer_address,
        t.employee_id as technician_employee_id,
        tu.full_name as technician_name,
        tu.phone as technician_phone,
        tu.email as technician_email,
        ce.serial_number as equipment_serial,
        ce.asset_tag as equipment_asset_tag,
        ce.location_details as equipment_location,
        et.name as equipment_name,
        et.brand as equipment_brand,
        et.model as equipment_model,
        et.category as equipment_category
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN technicians t ON j.technician_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      LEFT JOIN customer_equipment ce ON j.equipment_id = ce.id
      LEFT JOIN equipment_types et ON ce.equipment_type_id = et.id
      WHERE j.id = $1 AND j.company_id = $2
    `;

    const result = await query(jobQuery, [id, companyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      } as ApiResponse);
    }

    const row = result.rows[0];
    const job = {
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
      customer_signature: row.customer_signature,
      technician_notes: row.technician_notes,
      customer_feedback: row.customer_feedback,
      rating: row.rating,
      total_cost: row.total_cost,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      customer: row.customer_name ? {
        id: row.customer_id,
        name: row.customer_name,
        phone: row.customer_phone,
        email: row.customer_email,
        company_name: row.customer_company,
        address: row.customer_address
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
        asset_tag: row.equipment_asset_tag,
        location_details: row.equipment_location,
        equipment_type: {
          name: row.equipment_name,
          brand: row.equipment_brand,
          model: row.equipment_model,
          category: row.equipment_category
        }
      } : null
    };

    res.json({
      success: true,
      data: job
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job'
    } as ApiResponse);
  }
};

// Create new job/work order
export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== CREATE JOB DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Company ID:', req.company?.id);
    console.log('User ID:', req.user?.id);

    const {
      customer_id,
      equipment_id,
      technician_id,
      title,
      description,
      priority = 'medium',
      status = 'assigned',
      scheduled_date,
      due_date,
      estimated_duration
    } = req.body;

    const companyId = req.company?.id;
    const userId = req.user?.id;

    if (!companyId) {
      console.log('ERROR: No company context found');
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Validation
    if (!customer_id || !technician_id || !title || !description) {
      console.log('ERROR: Missing required fields:', {
        customer_id: !!customer_id,
        technician_id: !!technician_id,
        title: !!title,
        description: !!description
      });
      return res.status(400).json({
        success: false,
        error: 'Customer, technician, title, and description are required'
      } as ApiResponse);
    }

    // Validate due_date is required and not in the past
    if (!due_date) {
      console.log('ERROR: Due date is required');
      return res.status(400).json({
        success: false,
        error: 'Due date is required'
      } as ApiResponse);
    }

    const dueDateObj = new Date(due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    if (dueDateObj < today) {
      console.log('ERROR: Due date cannot be in the past');
      return res.status(400).json({
        success: false,
        error: 'Due date cannot be in the past'
      } as ApiResponse);
    }

    // Verify customer exists and belongs to company
    console.log('Checking customer:', customer_id, 'for company:', companyId);
    const customerCheck = await query(
      'SELECT id FROM customers WHERE id = $1 AND company_id = $2',
      [customer_id, companyId]
    );
    console.log('Customer check result:', customerCheck.rows.length);

    if (customerCheck.rows.length === 0) {
      console.log('ERROR: Invalid customer ID');
      return res.status(400).json({
        success: false,
        error: 'Invalid customer ID'
      } as ApiResponse);
    }

    // Verify equipment exists and belongs to customer (if provided)
    if (equipment_id) {
      console.log('Checking equipment:', equipment_id, 'for customer:', customer_id, 'company:', companyId);
      const equipmentCheck = await query(
        'SELECT id FROM customer_equipment WHERE id = $1 AND customer_id = $2 AND company_id = $3',
        [equipment_id, customer_id, companyId]
      );
      console.log('Equipment check result:', equipmentCheck.rows.length);

      if (equipmentCheck.rows.length === 0) {
        console.log('ERROR: Invalid equipment ID or equipment does not belong to customer');
        return res.status(400).json({
          success: false,
          error: 'Invalid equipment ID or equipment does not belong to customer'
        } as ApiResponse);
      }
    }

    // Verify technician exists and belongs to company (required)
    console.log('Checking technician:', technician_id, 'for company:', companyId);
    const technicianCheck = await query(
      'SELECT id FROM technicians WHERE id = $1 AND company_id = $2',
      [technician_id, companyId]
    );
    console.log('Technician check result:', technicianCheck.rows.length);

    if (technicianCheck.rows.length === 0) {
      console.log('ERROR: Invalid technician ID');
      return res.status(400).json({
        success: false,
        error: 'Invalid technician ID'
      } as ApiResponse);
    }

    // Generate job number
    const jobNumberResult = await query(
      'SELECT COUNT(*) as count FROM jobs WHERE company_id = $1',
      [companyId]
    );
    const jobCount = parseInt(jobNumberResult.rows[0].count) + 1;
    const currentYear = new Date().getFullYear();
    const job_number = `WO-${currentYear}-${jobCount.toString().padStart(4, '0')}`;

    // Create job
    const insertQuery = `
      INSERT INTO jobs (
        company_id, customer_id, equipment_id, technician_id, job_number,
        title, description, priority, status, scheduled_date, due_date, estimated_duration, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      companyId,
      customer_id,
      equipment_id || null,
      technician_id,
      job_number,
      title,
      description,
      priority,
      status,
      scheduled_date || null,
      due_date,
      estimated_duration || null,
      userId
    ];

    const result = await query(insertQuery, values);
    const newJob = result.rows[0];

    // Fetch the complete job data with related information
    const completeJobResult = await query(`
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
        et.model as equipment_model
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN technicians t ON j.technician_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      LEFT JOIN customer_equipment ce ON j.equipment_id = ce.id
      LEFT JOIN equipment_types et ON ce.equipment_type_id = et.id
      WHERE j.id = $1
    `, [newJob.id]);

    const row = completeJobResult.rows[0];
    const jobData = {
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
      customer_signature: row.customer_signature,
      technician_notes: row.technician_notes,
      customer_feedback: row.customer_feedback,
      rating: row.rating,
      total_cost: row.total_cost,
      created_by: row.created_by,
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
      } : null
    };

    res.status(201).json({
      success: true,
      data: jobData,
      message: 'Job created successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create job'
    } as ApiResponse);
  }
};

// Update job/work order
export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      customer_id,
      equipment_id,
      technician_id,
      title,
      description,
      priority,
      status,
      scheduled_date,
      due_date,
      estimated_duration,
      technician_notes,
      customer_feedback,
      rating,
      total_cost
    } = req.body;

    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Check if job exists and belongs to company
    const existingJobResult = await query(
      'SELECT * FROM jobs WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );

    if (existingJobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      } as ApiResponse);
    }

    const existingJob = existingJobResult.rows[0];

    // Verify customer exists and belongs to company (if provided)
    if (customer_id && customer_id !== existingJob.customer_id) {
      const customerCheck = await query(
        'SELECT id FROM customers WHERE id = $1 AND company_id = $2',
        [customer_id, companyId]
      );

      if (customerCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid customer ID'
        } as ApiResponse);
      }
    }

    // Verify equipment exists and belongs to customer (if provided)
    if (equipment_id) {
      const finalCustomerId = customer_id || existingJob.customer_id;
      const equipmentCheck = await query(
        'SELECT id FROM customer_equipment WHERE id = $1 AND customer_id = $2 AND company_id = $3',
        [equipment_id, finalCustomerId, companyId]
      );

      if (equipmentCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid equipment ID or equipment does not belong to customer'
        } as ApiResponse);
      }
    }

    // Verify technician exists and belongs to company (if provided)
    if (technician_id) {
      const technicianCheck = await query(
        'SELECT id FROM technicians WHERE id = $1 AND company_id = $2',
        [technician_id, companyId]
      );

      if (technicianCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid technician ID'
        } as ApiResponse);
      }
    }

    // Validate due_date is not in the past (if provided)
    if (due_date !== undefined) {
      const dueDateObj = new Date(due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

      if (dueDateObj < today) {
        return res.status(400).json({
          success: false,
          error: 'Due date cannot be in the past'
        } as ApiResponse);
      }
    }

    // Handle status transitions
    let started_at = existingJob.started_at;
    let completed_at = existingJob.completed_at;

    if (status && status !== existingJob.status) {
      if (status === 'in_progress' && !started_at) {
        started_at = new Date().toISOString();
      } else if (status === 'completed' && !completed_at) {
        completed_at = new Date().toISOString();
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (customer_id !== undefined) {
      updateFields.push(`customer_id = $${paramIndex}`);
      updateValues.push(customer_id);
      paramIndex++;
    }

    if (equipment_id !== undefined) {
      updateFields.push(`equipment_id = $${paramIndex}`);
      updateValues.push(equipment_id);
      paramIndex++;
    }

    if (technician_id !== undefined) {
      updateFields.push(`technician_id = $${paramIndex}`);
      updateValues.push(technician_id);
      paramIndex++;
    }

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      updateValues.push(title);
      paramIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(description);
      paramIndex++;
    }

    if (priority !== undefined) {
      updateFields.push(`priority = $${paramIndex}`);
      updateValues.push(priority);
      paramIndex++;
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(status);
      paramIndex++;
    }

    if (scheduled_date !== undefined) {
      updateFields.push(`scheduled_date = $${paramIndex}`);
      updateValues.push(scheduled_date);
      paramIndex++;
    }

    if (due_date !== undefined) {
      updateFields.push(`due_date = $${paramIndex}`);
      updateValues.push(due_date);
      paramIndex++;
    }

    if (estimated_duration !== undefined) {
      updateFields.push(`estimated_duration = $${paramIndex}`);
      updateValues.push(estimated_duration);
      paramIndex++;
    }

    if (technician_notes !== undefined) {
      updateFields.push(`technician_notes = $${paramIndex}`);
      updateValues.push(technician_notes);
      paramIndex++;
    }

    if (customer_feedback !== undefined) {
      updateFields.push(`customer_feedback = $${paramIndex}`);
      updateValues.push(customer_feedback);
      paramIndex++;
    }

    if (rating !== undefined) {
      updateFields.push(`rating = $${paramIndex}`);
      updateValues.push(rating);
      paramIndex++;
    }

    if (total_cost !== undefined) {
      updateFields.push(`total_cost = $${paramIndex}`);
      updateValues.push(total_cost);
      paramIndex++;
    }

    if (started_at !== existingJob.started_at) {
      updateFields.push(`started_at = $${paramIndex}`);
      updateValues.push(started_at);
      paramIndex++;
    }

    if (completed_at !== existingJob.completed_at) {
      updateFields.push(`completed_at = $${paramIndex}`);
      updateValues.push(completed_at);
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

    // Add WHERE clause parameters
    updateValues.push(id, companyId);

    const updateQuery = `
      UPDATE jobs
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    const updatedJob = result.rows[0];

    res.json({
      success: true,
      data: updatedJob,
      message: 'Job updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job'
    } as ApiResponse);
  }
};

// Delete job/work order
export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Check if job exists and belongs to company
    const existingJobResult = await query(
      'SELECT id, status FROM jobs WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );

    if (existingJobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      } as ApiResponse);
    }

    const existingJob = existingJobResult.rows[0];

    // Prevent deletion of completed jobs (optional business rule)
    if (existingJob.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete completed jobs'
      } as ApiResponse);
    }

    // Delete the job (CASCADE will handle related records)
    await query('DELETE FROM jobs WHERE id = $1 AND company_id = $2', [id, companyId]);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete job'
    } as ApiResponse);
  }
};

// Update job status
export const updateJobStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      } as ApiResponse);
    }

    // Validate status
    const validStatuses: JobStatus[] = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      } as ApiResponse);
    }

    // Check if job exists
    const existingJobResult = await query(
      'SELECT status, started_at, completed_at FROM jobs WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );

    if (existingJobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      } as ApiResponse);
    }

    const existingJob = existingJobResult.rows[0];

    // Handle status transitions
    let started_at = existingJob.started_at;
    let completed_at = existingJob.completed_at;

    if (status === 'in_progress' && !started_at) {
      started_at = new Date().toISOString();
    } else if (status === 'completed' && !completed_at) {
      completed_at = new Date().toISOString();
    }

    // Update job status
    const updateQuery = `
      UPDATE jobs
      SET status = $1, started_at = $2, completed_at = $3, updated_at = NOW()
      WHERE id = $4 AND company_id = $5
      RETURNING *
    `;

    const result = await query(updateQuery, [status, started_at, completed_at, id, companyId]);
    const updatedJob = result.rows[0];

    res.json({
      success: true,
      data: updatedJob,
      message: 'Job status updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job status'
    } as ApiResponse);
  }
};

// Search technicians for job assignment
export const searchTechnicians = async (req: AuthRequest, res: Response) => {
  try {
    const { search = '' } = req.query;
    const companyId = req.company?.id;

    // Use company context if available, otherwise use the demo company ID as fallback
    const effectiveCompanyId = companyId || '9703f477-46e1-47d0-a0f4-fa1eeb521499';

    let searchCondition = '';
    let queryParams = [effectiveCompanyId];

    if (search) {
      searchCondition = `AND (u.full_name ILIKE $2 OR t.employee_id ILIKE $2)`;
      queryParams.push(`%${search}%`);
    }

    const techniciansQuery = `
      SELECT t.id, t.employee_id, u.full_name, t.is_available
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      WHERE t.company_id = $1 AND u.is_active = true ${searchCondition}
      ORDER BY u.full_name
      LIMIT 50
    `;

    const techniciansResult = await query(techniciansQuery, queryParams);

    res.json({
      success: true,
      data: techniciansResult.rows
    } as ApiResponse);

  } catch (error) {
    console.error('Error searching technicians:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search technicians'
    } as ApiResponse);
  }
};

// Search customers for job assignment
export const searchCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { search = '' } = req.query;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    let searchCondition = '';
    let queryParams = [companyId];

    if (search) {
      searchCondition = `AND (name ILIKE $2 OR company_name ILIKE $2)`;
      queryParams.push(`%${search}%`);
    }

    const customersResult = await query(`
      SELECT id, name, company_name, phone, email
      FROM customers
      WHERE company_id = $1 AND is_active = true ${searchCondition}
      ORDER BY name
      LIMIT 50
    `, queryParams);

    res.json({
      success: true,
      data: customersResult.rows
    } as ApiResponse);

  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search customers'
    } as ApiResponse);
  }
};

// Search equipment for job assignment
export const searchEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const { search = '', customer_id } = req.query;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    let searchCondition = '';
    let queryParams = [companyId];
    let paramIndex = 2;

    if (customer_id) {
      searchCondition += ` AND ce.customer_id = $${paramIndex}`;
      queryParams.push(customer_id as string);
      paramIndex++;
    }

    if (search) {
      searchCondition += ` AND (et.brand ILIKE $${paramIndex} OR et.model ILIKE $${paramIndex} OR ce.serial_number ILIKE $${paramIndex} OR et.name ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
    }

    const equipmentResult = await query(`
      SELECT
        ce.id,
        ce.serial_number,
        ce.asset_tag,
        ce.location_details,
        et.name as equipment_name,
        et.brand,
        et.model,
        c.name as customer_name
      FROM customer_equipment ce
      JOIN equipment_types et ON ce.equipment_type_id = et.id
      JOIN customers c ON ce.customer_id = c.id
      WHERE ce.company_id = $1 AND ce.is_active = true ${searchCondition}
      ORDER BY et.brand, et.model, ce.serial_number
      LIMIT 50
    `, queryParams);

    res.json({
      success: true,
      data: equipmentResult.rows
    } as ApiResponse);

  } catch (error) {
    console.error('Error searching equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search equipment'
    } as ApiResponse);
  }
};

// Get job options for forms (customers, technicians, equipment)
export const getJobOptions = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: {
        priorities: ['low', 'medium', 'high', 'urgent'],
        statuses: ['assigned', 'in_progress', 'completed', 'cancelled', 'on_hold']
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching job options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job options'
    } as ApiResponse);
  }
};

// Get customer equipment for a specific customer
export const getCustomerEquipmentForJob = async (req: AuthRequest, res: Response) => {
  try {
    const { customer_id } = req.params;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    const equipmentResult = await query(`
      SELECT
        ce.id,
        ce.serial_number,
        ce.asset_tag,
        ce.location_details,
        et.name as equipment_name,
        et.brand,
        et.model
      FROM customer_equipment ce
      JOIN equipment_types et ON ce.equipment_type_id = et.id
      WHERE ce.customer_id = $1 AND ce.company_id = $2 AND ce.is_active = true
      ORDER BY et.brand, et.model, ce.serial_number
    `, [customer_id, companyId]);

    res.json({
      success: true,
      data: equipmentResult.rows
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching customer equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer equipment'
    } as ApiResponse);
  }
};
