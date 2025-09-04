import { Request, Response } from 'express';
import { query } from '../config/database';
import { ApiResponse, Customer } from '../types';

// Get all customers with pagination and filtering
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      company_name
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    // Temporary fix: Use the demo company ID until user-company relationships are implemented
    const companyId = req.company?.id || '82602012-7bc6-4d20-98b5-87efd9dda276';

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found. User must be associated with a company.'
      } as ApiResponse);
    }

    let whereConditions = ['c.company_id = $1'];
    let queryParams: any[] = [companyId];
    let paramIndex = 2;

    // Add search filter
    if (search) {
      whereConditions.push(`(c.name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex} OR c.company_name ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Add status filter
    if (status) {
      if (status === 'active') {
        whereConditions.push(`c.is_active = true`);
      } else if (status === 'inactive') {
        whereConditions.push(`c.is_active = false`);
      }
    }

    // Add company name filter
    if (company_name) {
      whereConditions.push(`c.company_name ILIKE $${paramIndex}`);
      queryParams.push(`%${company_name}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM customers c
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get customers with pagination
    const customersQuery = `
      SELECT
        c.*,
        (
          SELECT COUNT(*)::int
          FROM customer_equipment ce
          WHERE ce.customer_id = c.id AND ce.is_active = true
        ) as equipment_count,
        (
          SELECT COUNT(*)::int
          FROM jobs j
          WHERE j.customer_id = c.id
        ) as total_jobs
      FROM customers c
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(Number(limit), offset);
    const result = await query(customersQuery, queryParams);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        customers: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers'
    } as ApiResponse);
  }
};

// Get single customer by ID
export const getCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Temporary fix: Use the demo company ID until user-company relationships are implemented
    const companyId = req.company?.id || '82602012-7bc6-4d20-98b5-87efd9dda276';

    const customerQuery = `
      SELECT
        c.*,
        (
          SELECT COUNT(*)::int
          FROM customer_equipment ce
          WHERE ce.customer_id = c.id AND ce.is_active = true
        ) as equipment_count,
        (
          SELECT json_agg(
            json_build_object(
              'id', ce.id,
              'serial_number', ce.serial_number,
              'equipment_type', et.name,
              'brand', et.brand,
              'model', et.model,
              'condition', ce.condition,
              'last_service_date', ce.last_service_date
            )
          )
          FROM customer_equipment ce
          LEFT JOIN equipment_types et ON ce.equipment_type_id = et.id
          WHERE ce.customer_id = c.id AND ce.is_active = true
        ) as equipment,
        (
          SELECT COUNT(*)::int
          FROM jobs j
          WHERE j.customer_id = c.id
        ) as total_jobs,
        (
          SELECT json_agg(
            json_build_object(
              'id', j.id,
              'job_number', j.job_number,
              'title', j.title,
              'status', j.status,
              'priority', j.priority,
              'scheduled_date', j.scheduled_date,
              'completed_at', j.completed_at,
              'rating', j.rating,
              'total_cost', j.total_cost,
              'technician_name', u.full_name
            ) ORDER BY j.created_at DESC
          )
          FROM jobs j
          LEFT JOIN technicians t ON j.technician_id = t.id
          LEFT JOIN users u ON t.user_id = u.id
          WHERE j.customer_id = c.id
          LIMIT 10
        ) as recent_jobs
      FROM customers c
      WHERE c.id = $1 AND c.company_id = $2
    `;

    const result = await query(customerQuery, [id, companyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: result.rows[0]
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer'
    } as ApiResponse);
  }
};

// Create new customer
export const createCustomer = async (req: Request, res: Response) => {
  try {
    console.log('Creating customer with data:', req.body);

    const {
      name,
      email,
      phone,
      whatsapp_number,
      address,
      company_name,
      industry,
      company_size,
      business_type,
      tax_id,
      website,
      billing_address,
      billing_contact_name,
      billing_contact_email,
      billing_contact_phone,
      preferred_contact_method = 'phone',
      service_tier = 'standard',
      contract_type,
      contract_start_date,
      contract_end_date,
      payment_terms,
      credit_limit,
      discount_percentage = 0.00,
      priority_level = 'normal',
      assigned_account_manager,
      notes
    } = req.body;

    // Temporary fix: Use the demo company ID until user-company relationships are implemented
    const companyId = req.company?.id || '82602012-7bc6-4d20-98b5-87efd9dda276';

    console.log('Company ID:', companyId);

    // Validation
    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found. User must be associated with a company.'
      } as ApiResponse);
    }

    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        error: 'Name, phone, and address are required'
      } as ApiResponse);
    }

    // Check if customer with same email already exists (if email provided)
    if (email) {
      const existingCustomerResult = await query(
        'SELECT id FROM customers WHERE email = $1 AND company_id = $2',
        [email, companyId]
      );

      if (existingCustomerResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Customer with this email already exists'
        } as ApiResponse);
      }
    }

    const insertQuery = `
      INSERT INTO customers (
        company_id, name, email, phone, whatsapp_number, address, company_name,
        industry, company_size, business_type, tax_id, website, billing_address,
        billing_contact_name, billing_contact_email, billing_contact_phone,
        preferred_contact_method, service_tier, contract_type, contract_start_date,
        contract_end_date, payment_terms, credit_limit, discount_percentage,
        priority_level, assigned_account_manager, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING *
    `;

    // Convert empty strings to null for optional fields
    const cleanData = {
      companyId,
      name,
      email: email || null,
      phone,
      whatsapp_number: whatsapp_number || null,
      address,
      company_name: company_name || null,
      industry: industry || null,
      company_size: company_size || null,
      business_type: business_type || null,
      tax_id: tax_id || null,
      website: website || null,
      billing_address: billing_address || null,
      billing_contact_name: billing_contact_name || null,
      billing_contact_email: billing_contact_email || null,
      billing_contact_phone: billing_contact_phone || null,
      preferred_contact_method,
      service_tier,
      contract_type: contract_type || null,
      contract_start_date: contract_start_date || null,
      contract_end_date: contract_end_date || null,
      payment_terms: payment_terms || null,
      credit_limit: credit_limit ? parseFloat(credit_limit) : null,
      discount_percentage: discount_percentage ? parseFloat(discount_percentage) : 0.00,
      priority_level,
      assigned_account_manager: null, // TODO: Implement user selection dropdown in frontend
      notes: notes || null
    };

    console.log('Clean data:', cleanData);

    const result = await query(insertQuery, [
      cleanData.companyId, cleanData.name, cleanData.email, cleanData.phone,
      cleanData.whatsapp_number, cleanData.address, cleanData.company_name,
      cleanData.industry, cleanData.company_size, cleanData.business_type,
      cleanData.tax_id, cleanData.website, cleanData.billing_address,
      cleanData.billing_contact_name, cleanData.billing_contact_email,
      cleanData.billing_contact_phone, cleanData.preferred_contact_method,
      cleanData.service_tier, cleanData.contract_type, cleanData.contract_start_date,
      cleanData.contract_end_date, cleanData.payment_terms, cleanData.credit_limit,
      cleanData.discount_percentage, cleanData.priority_level,
      cleanData.assigned_account_manager, cleanData.notes
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Customer created successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error creating customer:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));

    // Provide more specific error messages
    let errorMessage = 'Failed to create customer';
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);

      // Check for specific database errors
      if (error.message.includes('duplicate key')) {
        errorMessage = 'Customer with this email already exists';
      } else if (error.message.includes('violates foreign key constraint')) {
        errorMessage = 'Invalid company or user reference';
      } else if (error.message.includes('violates not-null constraint')) {
        errorMessage = 'Missing required field';
      } else if (error.message.includes('invalid input syntax')) {
        errorMessage = 'Invalid data format provided';
      }
    }

    res.status(500).json({
      success: false,
      error: errorMessage
    } as ApiResponse);
  }
};

// Update customer
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      whatsapp_number,
      address,
      company_name,
      industry,
      company_size,
      business_type,
      tax_id,
      website,
      billing_address,
      billing_contact_name,
      billing_contact_email,
      billing_contact_phone,
      preferred_contact_method,
      service_tier,
      contract_type,
      contract_start_date,
      contract_end_date,
      payment_terms,
      credit_limit,
      discount_percentage,
      priority_level,
      assigned_account_manager,
      notes,
      is_active
    } = req.body;

    // Temporary fix: Use the demo company ID until user-company relationships are implemented
    const companyId = req.company?.id || '82602012-7bc6-4d20-98b5-87efd9dda276';

    // Check if customer exists
    const existingQuery = `
      SELECT id FROM customers
      WHERE id = $1 AND company_id = $2
    `;
    const existingResult = await query(existingQuery, [id, companyId]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      } as ApiResponse);
    }

    // Check if email is being changed and if it conflicts with another customer
    if (email) {
      const emailCheckQuery = `
        SELECT id FROM customers
        WHERE email = $1 AND company_id = $2 AND id != $3
      `;
      const emailCheckResult = await query(emailCheckQuery, [email, companyId, id]);

      if (emailCheckResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Customer with this email already exists'
        } as ApiResponse);
      }
    }

    const updateQuery = `
      UPDATE customers SET
        name = $1,
        email = $2,
        phone = $3,
        whatsapp_number = $4,
        address = $5,
        company_name = $6,
        industry = $7,
        company_size = $8,
        business_type = $9,
        tax_id = $10,
        website = $11,
        billing_address = $12,
        billing_contact_name = $13,
        billing_contact_email = $14,
        billing_contact_phone = $15,
        preferred_contact_method = $16,
        service_tier = $17,
        contract_type = $18,
        contract_start_date = $19,
        contract_end_date = $20,
        payment_terms = $21,
        credit_limit = $22,
        discount_percentage = $23,
        priority_level = $24,
        assigned_account_manager = $25,
        notes = $26,
        is_active = $27,
        updated_at = NOW()
      WHERE id = $28 AND company_id = $29
      RETURNING *
    `;

    // Clean assigned_account_manager field - set to null for now since frontend sends string
    const cleanAssignedAccountManager = null; // TODO: Implement user selection dropdown in frontend

    // Clean date fields - convert empty strings to null for PostgreSQL
    const cleanContractStartDate = contract_start_date && contract_start_date.trim() !== '' ? contract_start_date : null;
    const cleanContractEndDate = contract_end_date && contract_end_date.trim() !== '' ? contract_end_date : null;

    const result = await query(updateQuery, [
      name, email, phone, whatsapp_number, address, company_name,
      industry, company_size, business_type, tax_id, website, billing_address,
      billing_contact_name, billing_contact_email, billing_contact_phone,
      preferred_contact_method, service_tier, contract_type, cleanContractStartDate,
      cleanContractEndDate, payment_terms, credit_limit, discount_percentage,
      priority_level, cleanAssignedAccountManager, notes, is_active, id, companyId
    ]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Customer updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update customer'
    } as ApiResponse);
  }
};

// Delete customer (soft delete)
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Temporary fix: Use the demo company ID until user-company relationships are implemented
    const companyId = req.company?.id || '82602012-7bc6-4d20-98b5-87efd9dda276';

    // Check if customer exists
    const existingQuery = `
      SELECT id FROM customers
      WHERE id = $1 AND company_id = $2
    `;
    const existingResult = await query(existingQuery, [id, companyId]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      } as ApiResponse);
    }

    // Check if customer has active equipment
    const equipmentCheckQuery = `
      SELECT COUNT(*) as count
      FROM customer_equipment
      WHERE customer_id = $1 AND is_active = true
    `;
    const equipmentCheckResult = await query(equipmentCheckQuery, [id]);
    const hasActiveEquipment = parseInt(equipmentCheckResult.rows[0].count) > 0;

    if (hasActiveEquipment) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete customer with active equipment. Please deactivate or reassign equipment first.'
      } as ApiResponse);
    }

    // Soft delete by setting is_active to false
    const deleteQuery = `
      UPDATE customers SET
        is_active = false,
        updated_at = NOW()
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `;

    const result = await query(deleteQuery, [id, companyId]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Customer deactivated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer'
    } as ApiResponse);
  }
};

// Toggle customer status
export const toggleCustomerStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Temporary fix: Use the demo company ID until user-company relationships are implemented
    const companyId = req.company?.id || '82602012-7bc6-4d20-98b5-87efd9dda276';

    // Get current status
    const currentStatusQuery = `
      SELECT is_active FROM customers
      WHERE id = $1 AND company_id = $2
    `;
    const currentStatusResult = await query(currentStatusQuery, [id, companyId]);

    if (currentStatusResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      } as ApiResponse);
    }

    const currentStatus = currentStatusResult.rows[0].is_active;
    const newStatus = !currentStatus;

    // Update status
    const updateQuery = `
      UPDATE customers SET
        is_active = $1,
        updated_at = NOW()
      WHERE id = $2 AND company_id = $3
      RETURNING *
    `;

    const result = await query(updateQuery, [newStatus, id, companyId]);

    res.json({
      success: true,
      data: result.rows[0],
      message: `Customer ${newStatus ? 'activated' : 'deactivated'} successfully`
    } as ApiResponse);

  } catch (error) {
    console.error('Error toggling customer status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle customer status'
    } as ApiResponse);
  }
};
