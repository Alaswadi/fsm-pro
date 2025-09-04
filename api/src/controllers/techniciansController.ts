import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { ApiResponse, Technician } from '../types';

// Get all technicians with pagination and filtering
export const getTechnicians = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      skills,
      location
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

    let whereConditions = ['t.company_id = $1'];
    let queryParams: any[] = [companyId]; // Use actual company ID from database
    let paramIndex = 2;

    // Add search filter
    if (search) {
      whereConditions.push(`(u.full_name ILIKE $${paramIndex} OR t.employee_id ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Add status filter
    if (status) {
      if (status === 'available') {
        whereConditions.push(`t.is_available = true`);
      } else if (status === 'unavailable') {
        whereConditions.push(`t.is_available = false`);
      }
    }

    // Add skills filter
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      whereConditions.push(`t.skills && $${paramIndex}`);
      queryParams.push(skillsArray);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get technicians with user details and skills/certifications
    const techniciansQuery = `
      SELECT
        t.*,
        u.full_name,
        u.email,
        u.phone,
        u.avatar_url,
        u.is_active as user_active,
        (SELECT COUNT(*) FROM jobs j WHERE j.technician_id = t.id AND j.status IN ('assigned', 'in_progress')) as current_jobs,
        (SELECT AVG(j.rating) FROM jobs j WHERE j.technician_id = t.id AND j.rating IS NOT NULL) as avg_rating,
        COALESCE(
          (SELECT json_agg(json_build_object('id', cs.id, 'name', cs.name, 'category', cs.category, 'proficiency_level', ts.proficiency_level))
           FROM technician_skills ts
           JOIN company_skills cs ON ts.skill_id = cs.id
           WHERE ts.technician_id = t.id AND cs.is_active = true),
          '[]'::json
        ) as skills,
        COALESCE(
          (SELECT json_agg(json_build_object('id', cc.id, 'name', cc.name, 'expiration_date', tc.expiration_date, 'is_verified', tc.is_verified))
           FROM technician_certifications tc
           JOIN company_certifications cc ON tc.certification_id = cc.id
           WHERE tc.technician_id = t.id AND cc.is_active = true),
          '[]'::json
        ) as certifications
      FROM technicians t
      LEFT JOIN users u ON t.user_id = u.id
      ${whereClause}
      ORDER BY u.full_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(Number(limit), offset);

    const techniciansResult = await query(techniciansQuery, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM technicians t
      LEFT JOIN users u ON t.user_id = u.id
      ${whereClause}
    `;

    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    const technicians = techniciansResult.rows.map(row => ({
      id: row.id,
      company_id: row.company_id,
      user_id: row.user_id,
      employee_id: row.employee_id,
      skills: Array.isArray(row.skills) ? row.skills : [],
      certifications: Array.isArray(row.certifications) ? row.certifications : [],
      hourly_rate: row.hourly_rate,
      is_available: row.is_available,
      current_location: row.current_location,
      max_jobs_per_day: row.max_jobs_per_day,
      working_hours: row.working_hours,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        avatar_url: row.avatar_url,
        is_active: row.user_active
      },
      current_jobs: parseInt(row.current_jobs) || 0,
      avg_rating: row.avg_rating ? parseFloat(row.avg_rating) : null
    }));

    res.json({
      success: true,
      data: {
        technicians,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get technicians error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Get single technician by ID
export const getTechnician = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const technicianQuery = `
      SELECT 
        t.*,
        u.full_name,
        u.email,
        u.phone,
        u.avatar_url,
        u.is_active as user_active,
        (SELECT COUNT(*) FROM jobs j WHERE j.technician_id = t.id AND j.status IN ('assigned', 'in_progress')) as current_jobs,
        (SELECT AVG(j.rating) FROM jobs j WHERE j.technician_id = t.id AND j.rating IS NOT NULL) as avg_rating
      FROM technicians t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `;

    const result = await query(technicianQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      } as ApiResponse);
    }

    const row = result.rows[0];
    const technician = {
      id: row.id,
      company_id: row.company_id,
      user_id: row.user_id,
      employee_id: row.employee_id,
      skills: row.skills || [],
      certifications: row.certifications || [],
      hourly_rate: row.hourly_rate,
      is_available: row.is_available,
      current_location: row.current_location,
      max_jobs_per_day: row.max_jobs_per_day,
      working_hours: row.working_hours,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        avatar_url: row.avatar_url,
        is_active: row.user_active
      },
      current_jobs: parseInt(row.current_jobs) || 0,
      avg_rating: row.avg_rating ? parseFloat(row.avg_rating) : null
    };

    res.json({
      success: true,
      data: technician
    } as ApiResponse);

  } catch (error) {
    console.error('Get technician error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Create new technician
export const createTechnician = async (req: Request, res: Response) => {
  try {
    console.log('Creating technician with data:', req.body);

    const {
      email,
      password,
      full_name,
      phone,
      employee_id,
      skill_ids = [],
      certification_ids = [],
      hourly_rate,
      max_jobs_per_day = 8,
      working_hours
    } = req.body;

    // Validation
    if (!email || !password || !full_name || !employee_id) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, full name, and employee ID are required'
      } as ApiResponse);
    }

    // Check if user email already exists
    const existingUserResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      } as ApiResponse);
    }

    // Check if employee ID already exists
    const existingTechResult = await query(
      'SELECT id FROM technicians WHERE employee_id = $1',
      [employee_id]
    );

    if (existingTechResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID already exists'
      } as ApiResponse);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Get company ID from request context
    const companyId = req.company?.id;
    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found. User must be associated with a company.'
      } as ApiResponse);
    }

    // Start transaction
    await query('BEGIN');

    try {
      // Create user first
      const userResult = await query(
        `INSERT INTO users (email, password_hash, full_name, phone, role, is_active, email_verified)
         VALUES ($1, $2, $3, $4, 'technician', true, true)
         RETURNING id`,
        [email, passwordHash, full_name, phone]
      );

      const userId = userResult.rows[0].id;

      // Create technician
      const technicianResult = await query(
        `INSERT INTO technicians (
          company_id, user_id, employee_id,
          hourly_rate, max_jobs_per_day, working_hours, is_available
        ) VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING *`,
        [
          companyId, // Use actual company ID from database
          userId,
          employee_id,
          hourly_rate,
          max_jobs_per_day,
          working_hours
        ]
      );

      const technicianId = technicianResult.rows[0].id;

      // Link skills if provided
      if (skill_ids && skill_ids.length > 0) {
        for (const skillId of skill_ids) {
          await query(
            'INSERT INTO technician_skills (technician_id, skill_id, proficiency_level) VALUES ($1, $2, $3)',
            [technicianId, skillId, 3] // Default proficiency level
          );
        }
      }

      // Link certifications if provided
      if (certification_ids && certification_ids.length > 0) {
        for (const certId of certification_ids) {
          await query(
            'INSERT INTO technician_certifications (technician_id, certification_id, is_verified) VALUES ($1, $2, $3)',
            [technicianId, certId, false] // Default to unverified
          );
        }
      }

      await query('COMMIT');

      const technician = technicianResult.rows[0];

      res.status(201).json({
        success: true,
        data: {
          ...technician,
          user: {
            id: userId,
            full_name,
            email,
            phone
          }
        }
      } as ApiResponse);

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Create technician error:', error);

    // Provide more specific error messages
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);

      // Check for specific database errors
      if (error.message.includes('duplicate key')) {
        errorMessage = 'Email or Employee ID already exists';
      } else if (error.message.includes('violates foreign key constraint')) {
        errorMessage = 'Invalid company reference';
      } else if (error.message.includes('violates not-null constraint')) {
        errorMessage = 'Missing required field';
      }
    }

    return res.status(500).json({
      success: false,
      error: errorMessage
    } as ApiResponse);
  }
};

// Update technician
export const updateTechnician = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      phone,
      employee_id,
      skill_ids = [],
      certification_ids = [],
      hourly_rate,
      is_available,
      max_jobs_per_day,
      working_hours
    } = req.body;

    console.log('Update technician request:', { id, body: req.body });

    // Check if technician exists
    const existingTechResult = await query(
      'SELECT user_id FROM technicians WHERE id = $1',
      [id]
    );

    if (existingTechResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      } as ApiResponse);
    }

    const userId = existingTechResult.rows[0].user_id;

    // Check if employee ID is being changed and if it already exists
    if (employee_id) {
      const existingEmployeeIdResult = await query(
        'SELECT id FROM technicians WHERE employee_id = $1 AND id != $2',
        [employee_id, id]
      );

      if (existingEmployeeIdResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID already exists'
        } as ApiResponse);
      }
    }

    // Check if email is being changed and if it already exists
    if (email) {
      const existingEmailResult = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (existingEmailResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists'
        } as ApiResponse);
      }
    }

    // Start transaction
    await query('BEGIN');

    try {
      // Update user information if provided
      if (full_name || email || phone) {
        const userUpdateFields = [];
        const userUpdateValues = [];
        let userParamIndex = 1;

        if (full_name) {
          userUpdateFields.push(`full_name = $${userParamIndex++}`);
          userUpdateValues.push(full_name);
        }
        if (email) {
          userUpdateFields.push(`email = $${userParamIndex++}`);
          userUpdateValues.push(email);
        }
        if (phone) {
          userUpdateFields.push(`phone = $${userParamIndex++}`);
          userUpdateValues.push(phone);
        }

        userUpdateValues.push(userId);

        await query(
          `UPDATE users SET ${userUpdateFields.join(', ')}, updated_at = NOW() WHERE id = $${userParamIndex}`,
          userUpdateValues
        );
      }

      // Update technician information
      const techUpdateFields = [];
      const techUpdateValues = [];
      let techParamIndex = 1;

      if (employee_id !== undefined) {
        techUpdateFields.push(`employee_id = $${techParamIndex++}`);
        techUpdateValues.push(employee_id);
      }
      if (hourly_rate !== undefined) {
        techUpdateFields.push(`hourly_rate = $${techParamIndex++}`);
        techUpdateValues.push(hourly_rate);
      }
      if (is_available !== undefined) {
        techUpdateFields.push(`is_available = $${techParamIndex++}`);
        techUpdateValues.push(is_available);
      }
      if (max_jobs_per_day !== undefined) {
        techUpdateFields.push(`max_jobs_per_day = $${techParamIndex++}`);
        techUpdateValues.push(max_jobs_per_day);
      }
      if (working_hours !== undefined) {
        techUpdateFields.push(`working_hours = $${techParamIndex++}`);
        techUpdateValues.push(working_hours);
      }

      if (techUpdateFields.length > 0) {
        techUpdateValues.push(id);
        await query(
          `UPDATE technicians SET ${techUpdateFields.join(', ')}, updated_at = NOW() WHERE id = $${techParamIndex}`,
          techUpdateValues
        );
      }

      // Update skills - remove existing and add new ones
      if (skill_ids !== undefined) {
        // Remove existing skills
        await query('DELETE FROM technician_skills WHERE technician_id = $1', [id]);

        // Add new skills
        if (skill_ids && skill_ids.length > 0) {
          for (const skillId of skill_ids) {
            await query(
              'INSERT INTO technician_skills (technician_id, skill_id, proficiency_level) VALUES ($1, $2, $3)',
              [id, skillId, 3] // Default proficiency level
            );
          }
        }
      }

      // Update certifications - remove existing and add new ones
      if (certification_ids !== undefined) {
        // Remove existing certifications
        await query('DELETE FROM technician_certifications WHERE technician_id = $1', [id]);

        // Add new certifications
        if (certification_ids && certification_ids.length > 0) {
          for (const certId of certification_ids) {
            await query(
              'INSERT INTO technician_certifications (technician_id, certification_id, is_verified) VALUES ($1, $2, $3)',
              [id, certId, false] // Default to unverified
            );
          }
        }
      }

      await query('COMMIT');

      // Get updated technician with skills and certifications
      const updatedTechnicianQuery = `
        SELECT
          t.*,
          u.full_name,
          u.email,
          u.phone,
          u.avatar_url,
          u.is_active as user_active,
          COALESCE(
            (SELECT json_agg(json_build_object('id', cs.id, 'name', cs.name, 'category', cs.category, 'proficiency_level', ts.proficiency_level))
             FROM technician_skills ts
             JOIN company_skills cs ON ts.skill_id = cs.id
             WHERE ts.technician_id = t.id AND cs.is_active = true),
            '[]'::json
          ) as skills,
          COALESCE(
            (SELECT json_agg(json_build_object('id', cc.id, 'name', cc.name, 'expiration_date', tc.expiration_date, 'is_verified', tc.is_verified))
             FROM technician_certifications tc
             JOIN company_certifications cc ON tc.certification_id = cc.id
             WHERE tc.technician_id = t.id AND cc.is_active = true),
            '[]'::json
          ) as certifications
        FROM technicians t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = $1
      `;

      const result = await query(updatedTechnicianQuery, [id]);
      const row = result.rows[0];

      const technician = {
        id: row.id,
        company_id: row.company_id,
        user_id: row.user_id,
        employee_id: row.employee_id,
        skills: Array.isArray(row.skills) ? row.skills : [],
        certifications: Array.isArray(row.certifications) ? row.certifications : [],
        hourly_rate: row.hourly_rate,
        is_available: row.is_available,
        current_location: row.current_location,
        max_jobs_per_day: row.max_jobs_per_day,
        working_hours: row.working_hours,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: {
          id: row.user_id,
          full_name: row.full_name,
          email: row.email,
          phone: row.phone,
          avatar_url: row.avatar_url,
          is_active: row.user_active
        }
      };

      res.json({
        success: true,
        data: technician
      } as ApiResponse);

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Update technician error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Delete technician (hard delete - permanently removes from database)
export const deleteTechnician = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if technician exists and get user info
    const existingTechResult = await query(
      'SELECT user_id, employee_id FROM technicians WHERE id = $1',
      [id]
    );

    if (existingTechResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      } as ApiResponse);
    }

    const { user_id: userId, employee_id: employeeId } = existingTechResult.rows[0];

    // Check if technician has active jobs
    const activeJobsResult = await query(
      'SELECT COUNT(*) as count FROM jobs WHERE technician_id = $1 AND status IN ($2, $3)',
      [id, 'assigned', 'in_progress']
    );

    const activeJobsCount = parseInt(activeJobsResult.rows[0].count);

    if (activeJobsCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete technician with ${activeJobsCount} active job(s). Please reassign or complete the jobs first.`
      } as ApiResponse);
    }

    // Check if technician has any completed jobs (for audit trail warning)
    const completedJobsResult = await query(
      'SELECT COUNT(*) as count FROM jobs WHERE technician_id = $1',
      [id]
    );

    const totalJobsCount = parseInt(completedJobsResult.rows[0].count);

    // Start transaction for hard delete
    await query('BEGIN');

    try {
      // Step 1: Update any existing jobs to remove technician reference
      // (This will set technician_id to NULL due to ON DELETE SET NULL constraint)
      if (totalJobsCount > 0) {
        await query(
          'UPDATE jobs SET technician_id = NULL, updated_at = NOW() WHERE technician_id = $1',
          [id]
        );
      }

      // Step 2: Delete technician record
      // This will automatically cascade delete from technician_skills and technician_certifications
      // due to ON DELETE CASCADE constraints
      const deleteResult = await query(
        'DELETE FROM technicians WHERE id = $1',
        [id]
      );

      if (deleteResult.rowCount === 0) {
        throw new Error('Failed to delete technician record');
      }

      // Step 3: Delete the associated user account
      await query(
        'DELETE FROM users WHERE id = $1',
        [userId]
      );

      await query('COMMIT');

      res.json({
        success: true,
        message: `Technician ${employeeId} has been permanently deleted from the system.${totalJobsCount > 0 ? ` ${totalJobsCount} job record(s) have been updated to remove the technician assignment.` : ''}`
      } as ApiResponse);

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Delete technician error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Get available skills and certifications for technician forms
export const getTechnicianOptions = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.id;
    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Get company skills
    const skillsResult = await query(
      'SELECT id, name, category FROM company_skills WHERE company_id = $1 AND is_active = true ORDER BY category, name',
      [companyId]
    );

    // Get company certifications
    const certificationsResult = await query(
      'SELECT id, name, issuing_organization FROM company_certifications WHERE company_id = $1 AND is_active = true ORDER BY name',
      [companyId]
    );

    res.json({
      success: true,
      data: {
        skills: skillsResult.rows,
        certifications: certificationsResult.rows
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get technician options error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Toggle technician availability
export const toggleAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if technician exists
    const existingTechResult = await query(
      'SELECT is_available FROM technicians WHERE id = $1',
      [id]
    );

    if (existingTechResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      } as ApiResponse);
    }

    const currentAvailability = existingTechResult.rows[0].is_available;
    const newAvailability = !currentAvailability;

    await query(
      'UPDATE technicians SET is_available = $1, updated_at = NOW() WHERE id = $2',
      [newAvailability, id]
    );

    res.json({
      success: true,
      data: {
        is_available: newAvailability
      },
      message: `Technician ${newAvailability ? 'activated' : 'deactivated'} successfully`
    } as ApiResponse);

  } catch (error) {
    console.error('Toggle availability error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};
