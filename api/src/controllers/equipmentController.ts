import { Request, Response } from 'express';
import { query } from '../config/database';
import { ApiResponse, EquipmentType, CustomerEquipment, EquipmentInventoryCompatibility } from '../types';

// Equipment Types Controllers

// Get all equipment types with pagination and filtering
export const getEquipmentTypes = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      brand
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(et.name ILIKE $${paramIndex} OR et.brand ILIKE $${paramIndex} OR et.model ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (brand) {
      whereConditions.push(`et.brand = $${paramIndex}`);
      queryParams.push(brand);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM equipment_types et
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get equipment types
    const equipmentTypesQuery = `
      SELECT
        et.*,
        0 as equipment_count
      FROM equipment_types et
      ${whereClause}
      ORDER BY et.brand, et.model
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(Number(limit), offset);
    const result = await query(equipmentTypesQuery, queryParams);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        equipment_types: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching equipment types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch equipment types'
    } as ApiResponse);
  }
};

// Get single equipment type by ID
export const getEquipmentType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const equipmentTypeQuery = `
      SELECT
        et.*,
        0 as equipment_count
      FROM equipment_types et
      WHERE et.id = $1
    `;

    const result = await query(equipmentTypeQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Equipment type not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: result.rows[0]
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching equipment type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch equipment type'
    } as ApiResponse);
  }
};

// Create new equipment type
export const createEquipmentType = async (req: Request, res: Response) => {
  try {
    const {
      name,
      brand,
      model,
      description,
      manual_url,
      warranty_period_months = 12,
      image_url
    } = req.body;

    // Validation
    if (!name || !brand || !model) {
      return res.status(400).json({
        success: false,
        error: 'Name, brand, and model are required'
      } as ApiResponse);
    }

    // Check if equipment type already exists
    const existingQuery = `
      SELECT id FROM equipment_types
      WHERE brand = $1 AND model = $2
    `;
    const existingResult = await query(existingQuery, [brand, model]);

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Equipment type with this brand and model already exists'
      } as ApiResponse);
    }

    const insertQuery = `
      INSERT INTO equipment_types (
        name, brand, model, description, manual_url, warranty_period_months, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      name, brand, model, description, manual_url, warranty_period_months, image_url
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Equipment type created successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error creating equipment type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create equipment type'
    } as ApiResponse);
  }
};

// Update equipment type
export const updateEquipmentType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      brand,
      model,
      description,
      manual_url,
      warranty_period_months,
      image_url
    } = req.body;

    // Check if equipment type exists
    const existingQuery = `
      SELECT id FROM equipment_types
      WHERE id = $1
    `;
    const existingResult = await query(existingQuery, [id]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Equipment type not found'
      } as ApiResponse);
    }

    // Check for duplicate brand/model if they're being changed
    if (brand && model) {
      const duplicateQuery = `
        SELECT id FROM equipment_types
        WHERE brand = $1 AND model = $2 AND id != $3
      `;
      const duplicateResult = await query(duplicateQuery, [brand, model, id]);

      if (duplicateResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Equipment type with this brand and model already exists'
        } as ApiResponse);
      }
    }

    const updateQuery = `
      UPDATE equipment_types SET
        name = COALESCE($1, name),
        brand = COALESCE($2, brand),
        model = COALESCE($3, model),
        description = COALESCE($4, description),
        manual_url = COALESCE($5, manual_url),
        warranty_period_months = COALESCE($6, warranty_period_months),
        image_url = COALESCE($7, image_url),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;

    const result = await query(updateQuery, [
      name, brand, model, description, manual_url, warranty_period_months, image_url, id
    ]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Equipment type updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating equipment type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update equipment type'
    } as ApiResponse);
  }
};

// Delete equipment type
export const deleteEquipmentType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if equipment type exists
    const existingQuery = `
      SELECT id FROM equipment_types
      WHERE id = $1
    `;
    const existingResult = await query(existingQuery, [id]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Equipment type not found'
      } as ApiResponse);
    }

    // Delete the equipment type
    const deleteQuery = `
      DELETE FROM equipment_types
      WHERE id = $1
    `;

    await query(deleteQuery, [id]);

    res.json({
      success: true,
      message: 'Equipment type deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error deleting equipment type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete equipment type'
    } as ApiResponse);
  }
};

// Customer Equipment Controllers

// Get all customer equipment with pagination and filtering
export const getCustomerEquipment = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      customer_id,
      equipment_type_id,
      condition
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

    let whereConditions = ['ce.company_id = $1', 'ce.is_active = true'];
    let queryParams: any[] = [companyId];
    let paramIndex = 2;

    if (search) {
      whereConditions.push(`(ce.serial_number ILIKE $${paramIndex} OR ce.asset_tag ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex} OR et.brand ILIKE $${paramIndex} OR et.model ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (customer_id) {
      whereConditions.push(`ce.customer_id = $${paramIndex}`);
      queryParams.push(customer_id);
      paramIndex++;
    }

    if (equipment_type_id) {
      whereConditions.push(`ce.equipment_type_id = $${paramIndex}`);
      queryParams.push(equipment_type_id);
      paramIndex++;
    }

    if (condition) {
      whereConditions.push(`ce.condition = $${paramIndex}`);
      queryParams.push(condition);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM customer_equipment ce
      LEFT JOIN customers c ON ce.customer_id = c.id
      LEFT JOIN equipment_types et ON ce.equipment_type_id = et.id
      WHERE ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get customer equipment with related data
    const equipmentQuery = `
      SELECT
        ce.*,
        c.name as customer_name,
        c.company_name as customer_company,
        et.name as equipment_name,
        et.brand as equipment_brand,
        et.model as equipment_model,
        et.category as equipment_category,
        row_to_json(c.*) as customer,
        row_to_json(et.*) as equipment_type
      FROM customer_equipment ce
      LEFT JOIN customers c ON ce.customer_id = c.id
      LEFT JOIN equipment_types et ON ce.equipment_type_id = et.id
      WHERE ${whereClause}
      ORDER BY ce.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(Number(limit), offset);
    const result = await query(equipmentQuery, queryParams);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        customer_equipment: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching customer equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer equipment'
    } as ApiResponse);
  }
};

// Get single customer equipment by ID
export const getCustomerEquipmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Temporary fix: Use the demo company ID until user-company relationships are implemented
    const companyId = req.company?.id || '82602012-7bc6-4d20-98b5-87efd9dda276';

    const equipmentQuery = `
      SELECT
        ce.*,
        row_to_json(c.*) as customer,
        row_to_json(et.*) as equipment_type
      FROM customer_equipment ce
      LEFT JOIN customers c ON ce.customer_id = c.id
      LEFT JOIN equipment_types et ON ce.equipment_type_id = et.id
      WHERE ce.id = $1 AND ce.company_id = $2
    `;

    const result = await query(equipmentQuery, [id, companyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer equipment not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: result.rows[0]
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching customer equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer equipment'
    } as ApiResponse);
  }
};

// Create new customer equipment
export const createCustomerEquipment = async (req: Request, res: Response) => {
  try {
    const {
      customer_id,
      equipment_type_id,
      serial_number,
      asset_tag,
      purchase_date,
      warranty_expiry,
      installation_date,
      location_details,
      condition = 'good',
      last_service_date,
      next_service_date,
      notes
    } = req.body;

    // Temporary fix: Use the demo company ID until user-company relationships are implemented
    const companyId = req.company?.id || '82602012-7bc6-4d20-98b5-87efd9dda276';

    // Validation
    if (!customer_id || !equipment_type_id || !serial_number) {
      return res.status(400).json({
        success: false,
        error: 'Customer, equipment type, and serial number are required'
      } as ApiResponse);
    }

    // Check if serial number already exists
    const existingQuery = `
      SELECT id FROM customer_equipment
      WHERE company_id = $1 AND serial_number = $2
    `;
    const existingResult = await query(existingQuery, [companyId, serial_number]);

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Equipment with this serial number already exists'
      } as ApiResponse);
    }

    // Verify customer and equipment type exist
    const customerQuery = `SELECT id FROM customers WHERE id = $1 AND company_id = $2`;
    const customerResult = await query(customerQuery, [customer_id, companyId]);

    if (customerResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Customer not found'
      } as ApiResponse);
    }

    const equipmentTypeQuery = `SELECT id FROM equipment_types WHERE id = $1`;
    const equipmentTypeResult = await query(equipmentTypeQuery, [equipment_type_id]);

    if (equipmentTypeResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Equipment type not found'
      } as ApiResponse);
    }

    const insertQuery = `
      INSERT INTO customer_equipment (
        company_id, customer_id, equipment_type_id, serial_number, asset_tag,
        purchase_date, warranty_expiry, installation_date, location_details,
        condition, last_service_date, next_service_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      companyId, customer_id, equipment_type_id, serial_number, asset_tag,
      purchase_date, warranty_expiry, installation_date, location_details,
      condition, last_service_date, next_service_date, notes
    ]);

    // Get the created equipment with related data
    const createdEquipmentQuery = `
      SELECT
        ce.*,
        row_to_json(c.*) as customer,
        row_to_json(et.*) as equipment_type
      FROM customer_equipment ce
      LEFT JOIN customers c ON ce.customer_id = c.id
      LEFT JOIN equipment_types et ON ce.equipment_type_id = et.id
      WHERE ce.id = $1
    `;

    const createdResult = await query(createdEquipmentQuery, [result.rows[0].id]);

    res.status(201).json({
      success: true,
      data: createdResult.rows[0],
      message: 'Customer equipment created successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error creating customer equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer equipment'
    } as ApiResponse);
  }
};

// Update customer equipment
export const updateCustomerEquipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      customer_id,
      equipment_type_id,
      serial_number,
      asset_tag,
      purchase_date,
      warranty_expiry,
      installation_date,
      location_details,
      condition,
      last_service_date,
      next_service_date,
      notes,
      is_active
    } = req.body;

    // Temporary fix: Use the demo company ID until user-company relationships are implemented
    const companyId = req.company?.id || '82602012-7bc6-4d20-98b5-87efd9dda276';

    // Check if equipment exists
    const existingQuery = `
      SELECT id FROM customer_equipment
      WHERE id = $1 AND company_id = $2
    `;
    const existingResult = await query(existingQuery, [id, companyId]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer equipment not found'
      } as ApiResponse);
    }

    // Check for duplicate serial number if it's being changed
    if (serial_number) {
      const duplicateQuery = `
        SELECT id FROM customer_equipment
        WHERE company_id = $1 AND serial_number = $2 AND id != $3
      `;
      const duplicateResult = await query(duplicateQuery, [companyId, serial_number, id]);

      if (duplicateResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Equipment with this serial number already exists'
        } as ApiResponse);
      }
    }

    const updateQuery = `
      UPDATE customer_equipment SET
        customer_id = COALESCE($1, customer_id),
        equipment_type_id = COALESCE($2, equipment_type_id),
        serial_number = COALESCE($3, serial_number),
        asset_tag = COALESCE($4, asset_tag),
        purchase_date = COALESCE($5, purchase_date),
        warranty_expiry = COALESCE($6, warranty_expiry),
        installation_date = COALESCE($7, installation_date),
        location_details = COALESCE($8, location_details),
        condition = COALESCE($9, condition),
        last_service_date = COALESCE($10, last_service_date),
        next_service_date = COALESCE($11, next_service_date),
        notes = COALESCE($12, notes),
        is_active = COALESCE($13, is_active),
        updated_at = NOW()
      WHERE id = $14 AND company_id = $15
      RETURNING *
    `;

    const result = await query(updateQuery, [
      customer_id, equipment_type_id, serial_number, asset_tag,
      purchase_date, warranty_expiry, installation_date, location_details,
      condition, last_service_date, next_service_date, notes, is_active,
      id, companyId
    ]);

    // Get the updated equipment with related data
    const updatedEquipmentQuery = `
      SELECT
        ce.*,
        row_to_json(c.*) as customer,
        row_to_json(et.*) as equipment_type
      FROM customer_equipment ce
      LEFT JOIN customers c ON ce.customer_id = c.id
      LEFT JOIN equipment_types et ON ce.equipment_type_id = et.id
      WHERE ce.id = $1
    `;

    const updatedResult = await query(updatedEquipmentQuery, [id]);

    res.json({
      success: true,
      data: updatedResult.rows[0],
      message: 'Customer equipment updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating customer equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update customer equipment'
    } as ApiResponse);
  }
};

// Delete customer equipment (soft delete)
export const deleteCustomerEquipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Temporary fix: Use the demo company ID until user-company relationships are implemented
    const companyId = req.company?.id || '82602012-7bc6-4d20-98b5-87efd9dda276';

    // Check if equipment exists
    const existingQuery = `
      SELECT id FROM customer_equipment
      WHERE id = $1 AND company_id = $2
    `;
    const existingResult = await query(existingQuery, [id, companyId]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer equipment not found'
      } as ApiResponse);
    }

    // Check if equipment is referenced in jobs
    const jobsQuery = `
      SELECT COUNT(*) as count FROM jobs
      WHERE equipment_id = $1 AND status NOT IN ('completed', 'cancelled')
    `;
    const jobsResult = await query(jobsQuery, [id]);

    if (parseInt(jobsResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete equipment that has active jobs'
      } as ApiResponse);
    }

    // Soft delete
    const deleteQuery = `
      UPDATE customer_equipment SET
        is_active = false,
        updated_at = NOW()
      WHERE id = $1 AND company_id = $2
    `;

    await query(deleteQuery, [id, companyId]);

    res.json({
      success: true,
      message: 'Customer equipment deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error deleting customer equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer equipment'
    } as ApiResponse);
  }
};

// Get equipment options for forms (customers and equipment types)
export const getEquipmentOptions = async (req: Request, res: Response) => {
  try {
    // Get equipment types
    const equipmentTypesQuery = `
      SELECT id, name, brand, model
      FROM equipment_types
      ORDER BY brand, model
    `;
    const equipmentTypesResult = await query(equipmentTypesQuery, []);

    // Get brands
    const brandsQuery = `
      SELECT DISTINCT brand
      FROM equipment_types
      WHERE brand IS NOT NULL
      ORDER BY brand
    `;
    const brandsResult = await query(brandsQuery, []);

    res.json({
      success: true,
      data: {
        customers: [],
        equipment_types: equipmentTypesResult.rows,
        categories: [],
        brands: brandsResult.rows.map(row => row.brand),
        parts: []
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching equipment options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch equipment options'
    } as ApiResponse);
  }
};

// Equipment-Inventory Compatibility Controllers

// Get compatibility relationships for an equipment type
export const getEquipmentCompatibility = async (req: Request, res: Response) => {
  try {
    const { equipment_type_id } = req.params;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    const compatibilityQuery = `
      SELECT
        eic.*,
        row_to_json(et.*) as equipment_type,
        row_to_json(p.*) as part
      FROM equipment_inventory_compatibility eic
      LEFT JOIN equipment_types et ON eic.equipment_type_id = et.id
      LEFT JOIN parts p ON eic.part_id = p.id
      WHERE eic.equipment_type_id = $1 AND et.company_id = $2
      ORDER BY eic.compatibility_type, p.name
    `;

    const result = await query(compatibilityQuery, [equipment_type_id, companyId]);

    res.json({
      success: true,
      data: {
        compatibility: result.rows
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching equipment compatibility:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch equipment compatibility'
    } as ApiResponse);
  }
};

// Add compatibility relationship
export const addEquipmentCompatibility = async (req: Request, res: Response) => {
  try {
    const {
      equipment_type_id,
      part_id,
      compatibility_type = 'compatible',
      usage_notes
    } = req.body;

    const companyId = req.company?.id;

    // Validation
    if (!equipment_type_id || !part_id) {
      return res.status(400).json({
        success: false,
        error: 'Equipment type and part are required'
      } as ApiResponse);
    }

    // Verify equipment type exists
    const equipmentTypeQuery = `SELECT id FROM equipment_types WHERE id = $1`;
    const equipmentTypeResult = await query(equipmentTypeQuery, [equipment_type_id]);

    if (equipmentTypeResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Equipment type not found'
      } as ApiResponse);
    }

    const partQuery = `SELECT id FROM parts WHERE id = $1 AND company_id = $2`;
    const partResult = await query(partQuery, [part_id, companyId]);

    if (partResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Part not found'
      } as ApiResponse);
    }

    // Check if compatibility already exists
    const existingQuery = `
      SELECT id FROM equipment_inventory_compatibility
      WHERE equipment_type_id = $1 AND part_id = $2
    `;
    const existingResult = await query(existingQuery, [equipment_type_id, part_id]);

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Compatibility relationship already exists'
      } as ApiResponse);
    }

    const insertQuery = `
      INSERT INTO equipment_inventory_compatibility (
        equipment_type_id, part_id, compatibility_type, usage_notes
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      equipment_type_id, part_id, compatibility_type, usage_notes
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Compatibility relationship created successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error creating equipment compatibility:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create equipment compatibility'
    } as ApiResponse);
  }
};

// Remove compatibility relationship
export const removeEquipmentCompatibility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.company?.id;

    // Verify compatibility exists and belongs to company equipment
    const compatibilityQuery = `
      SELECT eic.id
      FROM equipment_inventory_compatibility eic
      JOIN equipment_types et ON eic.equipment_type_id = et.id
      WHERE eic.id = $1 AND et.company_id = $2
    `;
    const compatibilityResult = await query(compatibilityQuery, [id, companyId]);

    if (compatibilityResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Compatibility relationship not found'
      } as ApiResponse);
    }

    const deleteQuery = `
      DELETE FROM equipment_inventory_compatibility
      WHERE id = $1
    `;

    await query(deleteQuery, [id]);

    res.json({
      success: true,
      message: 'Compatibility relationship removed successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error removing equipment compatibility:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove equipment compatibility'
    } as ApiResponse);
  }
};
