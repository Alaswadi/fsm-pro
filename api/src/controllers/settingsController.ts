import { Request, Response } from 'express';
import { query } from '../config/database';
import { ApiResponse } from '../types';

// Helper function to get user's company ID
const getUserCompanyId = async (userId: string): Promise<string | null> => {
  try {
    // First check if user is a technician
    const techResult = await query(
      'SELECT company_id FROM technicians WHERE user_id = $1',
      [userId]
    );
    
    if (techResult.rows.length > 0) {
      return techResult.rows[0].company_id;
    }
    
    // If not a technician, get the first company (for admin users)
    const companyResult = await query('SELECT id FROM companies LIMIT 1');
    return companyResult.rows.length > 0 ? companyResult.rows[0].id : null;
  } catch (error) {
    console.error('Error getting user company ID:', error);
    return null;
  }
};

// Get company profile
export const getCompanyProfile = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.id;
    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    const result = await query(
      'SELECT * FROM companies WHERE id = $1',
      [companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: result.rows[0]
    } as ApiResponse);

  } catch (error) {
    console.error('Get company profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Update company profile
export const updateCompanyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
    }

    const companyId = await getUserCompanyId(userId);
    if (!companyId) {
      return res.status(404).json({
        success: false,
        error: 'No company found for user'
      } as ApiResponse);
    }

    const {
      name,
      address,
      phone,
      email,
      website,
      business_type,
      tax_id,
      license_number,
      timezone,
      currency,
      date_format,
      time_format
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Company name is required'
      } as ApiResponse);
    }

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (name) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }
    if (address !== undefined) {
      updateFields.push(`address = $${paramIndex++}`);
      updateValues.push(address);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      updateValues.push(phone);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      updateValues.push(email);
    }
    if (website !== undefined) {
      updateFields.push(`website = $${paramIndex++}`);
      updateValues.push(website);
    }
    if (business_type !== undefined) {
      updateFields.push(`business_type = $${paramIndex++}`);
      updateValues.push(business_type);
    }
    if (tax_id !== undefined) {
      updateFields.push(`tax_id = $${paramIndex++}`);
      updateValues.push(tax_id);
    }
    if (license_number !== undefined) {
      updateFields.push(`license_number = $${paramIndex++}`);
      updateValues.push(license_number);
    }
    if (timezone !== undefined) {
      updateFields.push(`timezone = $${paramIndex++}`);
      updateValues.push(timezone);
    }
    if (currency !== undefined) {
      updateFields.push(`currency = $${paramIndex++}`);
      updateValues.push(currency);
    }
    if (date_format !== undefined) {
      updateFields.push(`date_format = $${paramIndex++}`);
      updateValues.push(date_format);
    }
    if (time_format !== undefined) {
      updateFields.push(`time_format = $${paramIndex++}`);
      updateValues.push(time_format);
    }

    updateValues.push(companyId);

    const result = await query(
      `UPDATE companies SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    res.json({
      success: true,
      data: result.rows[0]
    } as ApiResponse);

  } catch (error) {
    console.error('Update company profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Get company skills
export const getCompanySkills = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
    }

    const companyId = await getUserCompanyId(userId);
    if (!companyId) {
      return res.status(404).json({
        success: false,
        error: 'No company found for user'
      } as ApiResponse);
    }

    const result = await query(
      'SELECT * FROM company_skills WHERE company_id = $1 AND is_active = true ORDER BY sort_order, name',
      [companyId]
    );

    res.json({
      success: true,
      data: result.rows
    } as ApiResponse);

  } catch (error) {
    console.error('Get company skills error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Create company skill
export const createCompanySkill = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
    }

    const companyId = await getUserCompanyId(userId);
    if (!companyId) {
      return res.status(404).json({
        success: false,
        error: 'No company found for user'
      } as ApiResponse);
    }

    const { name, description, category, sort_order = 0 } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Skill name is required'
      } as ApiResponse);
    }

    // Check if skill already exists
    const existingSkill = await query(
      'SELECT id FROM company_skills WHERE company_id = $1 AND name = $2',
      [companyId, name]
    );

    if (existingSkill.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Skill with this name already exists'
      } as ApiResponse);
    }

    const result = await query(
      `INSERT INTO company_skills (company_id, name, description, category, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [companyId, name, description, category, sort_order]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    } as ApiResponse);

  } catch (error) {
    console.error('Create company skill error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Update company skill
export const updateCompanySkill = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
    }

    const companyId = await getUserCompanyId(userId);
    if (!companyId) {
      return res.status(404).json({
        success: false,
        error: 'No company found for user'
      } as ApiResponse);
    }

    const { name, description, category, sort_order, is_active } = req.body;

    // Check if skill exists and belongs to company
    const existingSkill = await query(
      'SELECT id FROM company_skills WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );

    if (existingSkill.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      } as ApiResponse);
    }

    // Check for duplicate name (excluding current skill)
    if (name) {
      const duplicateSkill = await query(
        'SELECT id FROM company_skills WHERE company_id = $1 AND name = $2 AND id != $3',
        [companyId, name, id]
      );

      if (duplicateSkill.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Skill with this name already exists'
        } as ApiResponse);
      }
    }

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }
    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      updateValues.push(category);
    }
    if (sort_order !== undefined) {
      updateFields.push(`sort_order = $${paramIndex++}`);
      updateValues.push(sort_order);
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(is_active);
    }

    updateValues.push(id);

    const result = await query(
      `UPDATE company_skills SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    res.json({
      success: true,
      data: result.rows[0]
    } as ApiResponse);

  } catch (error) {
    console.error('Update company skill error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Delete company skill
export const deleteCompanySkill = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
    }

    const companyId = await getUserCompanyId(userId);
    if (!companyId) {
      return res.status(404).json({
        success: false,
        error: 'No company found for user'
      } as ApiResponse);
    }

    // Check if skill exists and belongs to company
    const existingSkill = await query(
      'SELECT id FROM company_skills WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );

    if (existingSkill.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      } as ApiResponse);
    }

    // Check if skill is being used by technicians
    const skillUsage = await query(
      'SELECT COUNT(*) as count FROM technician_skills WHERE skill_id = $1',
      [id]
    );

    const usageCount = parseInt(skillUsage.rows[0].count);
    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete skill. It is currently assigned to ${usageCount} technician(s). Please remove it from all technicians first.`
      } as ApiResponse);
    }

    await query('DELETE FROM company_skills WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Skill deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Delete company skill error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Get company certifications
export const getCompanyCertifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
    }

    const companyId = await getUserCompanyId(userId);
    if (!companyId) {
      return res.status(404).json({
        success: false,
        error: 'No company found for user'
      } as ApiResponse);
    }

    const result = await query(
      'SELECT * FROM company_certifications WHERE company_id = $1 AND is_active = true ORDER BY sort_order, name',
      [companyId]
    );

    res.json({
      success: true,
      data: result.rows
    } as ApiResponse);

  } catch (error) {
    console.error('Get company certifications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Create company certification
export const createCompanyCertification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
    }

    const companyId = await getUserCompanyId(userId);
    if (!companyId) {
      return res.status(404).json({
        success: false,
        error: 'No company found for user'
      } as ApiResponse);
    }

    const {
      name,
      description,
      issuing_organization,
      validity_period_months,
      renewal_required = false,
      renewal_notice_days = 30,
      sort_order = 0
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Certification name is required'
      } as ApiResponse);
    }

    // Check if certification already exists
    const existingCert = await query(
      'SELECT id FROM company_certifications WHERE company_id = $1 AND name = $2',
      [companyId, name]
    );

    if (existingCert.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Certification with this name already exists'
      } as ApiResponse);
    }

    const result = await query(
      `INSERT INTO company_certifications (company_id, name, description, issuing_organization, validity_period_months, renewal_required, renewal_notice_days, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [companyId, name, description, issuing_organization, validity_period_months, renewal_required, renewal_notice_days, sort_order]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    } as ApiResponse);

  } catch (error) {
    console.error('Create company certification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Update company certification
export const updateCompanyCertification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
    }

    const companyId = await getUserCompanyId(userId);
    if (!companyId) {
      return res.status(404).json({
        success: false,
        error: 'No company found for user'
      } as ApiResponse);
    }

    const {
      name,
      description,
      issuing_organization,
      validity_period_months,
      renewal_required,
      renewal_notice_days,
      sort_order,
      is_active
    } = req.body;

    // Check if certification exists and belongs to company
    const existingCert = await query(
      'SELECT id FROM company_certifications WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );

    if (existingCert.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Certification not found'
      } as ApiResponse);
    }

    // Check for duplicate name (excluding current certification)
    if (name) {
      const duplicateCert = await query(
        'SELECT id FROM company_certifications WHERE company_id = $1 AND name = $2 AND id != $3',
        [companyId, name, id]
      );

      if (duplicateCert.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Certification with this name already exists'
        } as ApiResponse);
      }
    }

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }
    if (issuing_organization !== undefined) {
      updateFields.push(`issuing_organization = $${paramIndex++}`);
      updateValues.push(issuing_organization);
    }
    if (validity_period_months !== undefined) {
      updateFields.push(`validity_period_months = $${paramIndex++}`);
      updateValues.push(validity_period_months);
    }
    if (renewal_required !== undefined) {
      updateFields.push(`renewal_required = $${paramIndex++}`);
      updateValues.push(renewal_required);
    }
    if (renewal_notice_days !== undefined) {
      updateFields.push(`renewal_notice_days = $${paramIndex++}`);
      updateValues.push(renewal_notice_days);
    }
    if (sort_order !== undefined) {
      updateFields.push(`sort_order = $${paramIndex++}`);
      updateValues.push(sort_order);
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(is_active);
    }

    updateValues.push(id);

    const result = await query(
      `UPDATE company_certifications SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    res.json({
      success: true,
      data: result.rows[0]
    } as ApiResponse);

  } catch (error) {
    console.error('Update company certification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Delete company certification
export const deleteCompanyCertification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
    }

    const companyId = await getUserCompanyId(userId);
    if (!companyId) {
      return res.status(404).json({
        success: false,
        error: 'No company found for user'
      } as ApiResponse);
    }

    // Check if certification exists and belongs to company
    const existingCert = await query(
      'SELECT id FROM company_certifications WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );

    if (existingCert.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Certification not found'
      } as ApiResponse);
    }

    // Check if certification is being used by technicians
    const certUsage = await query(
      'SELECT COUNT(*) as count FROM technician_certifications WHERE certification_id = $1',
      [id]
    );

    const usageCount = parseInt(certUsage.rows[0].count);
    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete certification. It is currently assigned to ${usageCount} technician(s). Please remove it from all technicians first.`
      } as ApiResponse);
    }

    await query('DELETE FROM company_certifications WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Certification deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Delete company certification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};
