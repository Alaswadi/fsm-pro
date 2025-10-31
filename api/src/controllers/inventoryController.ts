import { Request, Response } from 'express';
import { query } from '../config/database';
import { ApiResponse, Part } from '../types';

// Get all inventory items with pagination and filtering
export const getInventoryItems = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      equipment_type_id,
      status,
      low_stock_only
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found. User must be associated with a company.'
      } as ApiResponse);
    }

    let whereConditions = ['p.company_id = $1'];
    let queryParams: any[] = [companyId];
    let paramIndex = 2;

    // Add search filter
    if (search) {
      whereConditions.push(`(p.name ILIKE $${paramIndex} OR p.part_number ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Add category filter
    if (category) {
      whereConditions.push(`p.category = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }

    // Add equipment type filter
    if (equipment_type_id) {
      whereConditions.push(`p.equipment_type_id = $${paramIndex}`);
      queryParams.push(equipment_type_id);
      paramIndex++;
    }

    // Add status filter
    if (status) {
      whereConditions.push(`p.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    // Add low stock filter
    if (low_stock_only === 'true') {
      whereConditions.push(`p.current_stock <= p.min_stock_level`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get inventory items with equipment type details
    const inventoryQuery = `
      SELECT
        p.*,
        CASE
          WHEN p.current_stock <= 0 THEN 'out_of_stock'
          WHEN p.current_stock <= p.min_stock_level THEN 'low_stock'
          ELSE 'available'
        END as computed_status,
        json_build_object(
          'id', et.id,
          'name', et.name,
          'brand', et.brand,
          'model', et.model,
          'category', et.category
        ) as equipment_type
      FROM parts p
      LEFT JOIN equipment_types et ON p.equipment_type_id = et.id
      ${whereClause}
      ORDER BY p.name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(Number(limit), offset);

    const inventoryResult = await query(inventoryQuery, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM parts p
      ${whereClause}
    `;

    const countResult = await query(countQuery, queryParams.slice(0, -2)); // Remove limit and offset
    const total = parseInt(countResult.rows[0].total);

    // Transform the results
    const inventoryItems = inventoryResult.rows.map(row => ({
      ...row,
      current_stock: parseInt(row.current_stock) || 0,
      min_stock_level: parseInt(row.min_stock_level) || 0,
      max_stock_level: parseInt(row.max_stock_level) || 0,
      unit_price: parseFloat(row.unit_price) || 0,
      cost_price: row.cost_price ? parseFloat(row.cost_price) : null
    }));

    res.json({
      success: true,
      data: {
        inventory_items: inventoryItems,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get inventory items error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Get single inventory item by ID
export const getInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    const inventoryQuery = `
      SELECT p.*
      FROM parts p
      WHERE p.id = $1 AND p.company_id = $2
    `;

    const result = await query(inventoryQuery, [id, companyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      } as ApiResponse);
    }

    const inventoryItem = {
      ...result.rows[0],
      current_stock: parseInt(result.rows[0].current_stock) || 0,
      min_stock_level: parseInt(result.rows[0].min_stock_level) || 0,
      max_stock_level: parseInt(result.rows[0].max_stock_level) || 0,
      unit_price: parseFloat(result.rows[0].unit_price) || 0,
      cost_price: result.rows[0].cost_price ? parseFloat(result.rows[0].cost_price) : null
    };

    res.json({
      success: true,
      data: inventoryItem
    } as ApiResponse);

  } catch (error) {
    console.error('Get inventory item error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Create new inventory item
export const createInventoryItem = async (req: Request, res: Response) => {
  try {
    const {
      part_number,
      name,
      description,
      category,
      equipment_type_id,
      unit_price,
      cost_price,
      current_stock = 0,
      min_stock_level = 0,
      max_stock_level = 100,
      status = 'available',
      supplier_info,
      compatible_equipment = [],
      image_url
    } = req.body;

    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Validation
    if (!part_number || !name || !unit_price) {
      return res.status(400).json({
        success: false,
        error: 'Part number, name, and unit price are required'
      } as ApiResponse);
    }

    // Check if part number already exists
    const existingPartResult = await query(
      'SELECT id FROM parts WHERE part_number = $1 AND company_id = $2',
      [part_number, companyId]
    );

    if (existingPartResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Part number already exists'
      } as ApiResponse);
    }

    const insertQuery = `
      INSERT INTO parts (
        company_id, part_number, name, description, category, equipment_type_id,
        unit_price, cost_price, current_stock, min_stock_level, max_stock_level,
        status, supplier_info, compatible_equipment, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      companyId, part_number, name, description, category, equipment_type_id,
      unit_price, cost_price, current_stock, min_stock_level, max_stock_level,
      status, supplier_info, compatible_equipment, image_url
    ]);

    const createdItem = {
      ...result.rows[0],
      current_stock: parseInt(result.rows[0].current_stock) || 0,
      min_stock_level: parseInt(result.rows[0].min_stock_level) || 0,
      max_stock_level: parseInt(result.rows[0].max_stock_level) || 0,
      unit_price: parseFloat(result.rows[0].unit_price) || 0,
      cost_price: result.rows[0].cost_price ? parseFloat(result.rows[0].cost_price) : null
    };

    res.status(201).json({
      success: true,
      data: createdItem,
      message: 'Inventory item created successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Create inventory item error:', error);

    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        errorMessage = 'Part number already exists';
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

// Update inventory item
export const updateInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      part_number,
      name,
      description,
      category,
      equipment_type_id,
      unit_price,
      cost_price,
      current_stock,
      min_stock_level,
      max_stock_level,
      status,
      supplier_info,
      compatible_equipment,
      image_url
    } = req.body;

    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Check if inventory item exists
    const existingItemResult = await query(
      'SELECT id FROM parts WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );

    if (existingItemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      } as ApiResponse);
    }

    // Check if part number already exists for another item
    if (part_number) {
      const duplicatePartResult = await query(
        'SELECT id FROM parts WHERE part_number = $1 AND company_id = $2 AND id != $3',
        [part_number, companyId, id]
      );

      if (duplicatePartResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Part number already exists'
        } as ApiResponse);
      }
    }

    const updateQuery = `
      UPDATE parts SET
        part_number = COALESCE($1, part_number),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        category = COALESCE($4, category),
        equipment_type_id = COALESCE($5, equipment_type_id),
        unit_price = COALESCE($6, unit_price),
        cost_price = COALESCE($7, cost_price),
        current_stock = COALESCE($8, current_stock),
        min_stock_level = COALESCE($9, min_stock_level),
        max_stock_level = COALESCE($10, max_stock_level),
        status = COALESCE($11, status),
        supplier_info = COALESCE($12, supplier_info),
        compatible_equipment = COALESCE($13, compatible_equipment),
        image_url = COALESCE($14, image_url),
        updated_at = NOW()
      WHERE id = $15 AND company_id = $16
      RETURNING *
    `;

    const result = await query(updateQuery, [
      part_number, name, description, category, equipment_type_id,
      unit_price, cost_price, current_stock, min_stock_level, max_stock_level,
      status, supplier_info, compatible_equipment, image_url,
      id, companyId
    ]);

    const updatedItem = {
      ...result.rows[0],
      current_stock: parseInt(result.rows[0].current_stock) || 0,
      min_stock_level: parseInt(result.rows[0].min_stock_level) || 0,
      max_stock_level: parseInt(result.rows[0].max_stock_level) || 0,
      unit_price: parseFloat(result.rows[0].unit_price) || 0,
      cost_price: result.rows[0].cost_price ? parseFloat(result.rows[0].cost_price) : null
    };

    res.json({
      success: true,
      data: updatedItem,
      message: 'Inventory item updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Update inventory item error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update inventory item'
    } as ApiResponse);
  }
};

// Delete inventory item
export const deleteInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Check if inventory item exists
    const existingItemResult = await query(
      'SELECT id FROM parts WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );

    if (existingItemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      } as ApiResponse);
    }

    // Check if item is used in any jobs (prevent deletion if in use)
    const jobUsageResult = await query(
      'SELECT id FROM job_parts WHERE part_id = $1 LIMIT 1',
      [id]
    );

    if (jobUsageResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete inventory item that has been used in jobs. Consider marking it as discontinued instead.'
      } as ApiResponse);
    }

    // Delete the inventory item
    await query(
      'DELETE FROM parts WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Delete inventory item error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete inventory item'
    } as ApiResponse);
  }
};

// Update stock levels
export const updateStockLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, operation = 'set', notes } = req.body;

    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required'
      } as ApiResponse);
    }

    // Get current stock
    const currentStockResult = await query(
      'SELECT current_stock FROM parts WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );

    if (currentStockResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      } as ApiResponse);
    }

    const currentStock = parseInt(currentStockResult.rows[0].current_stock) || 0;
    let newStock = currentStock;

    switch (operation) {
      case 'add':
        newStock = currentStock + quantity;
        break;
      case 'subtract':
        newStock = Math.max(0, currentStock - quantity);
        break;
      case 'set':
      default:
        newStock = quantity;
        break;
    }

    // Update stock level
    const updateQuery = `
      UPDATE parts SET
        current_stock = $1,
        status = CASE
          WHEN $1 <= 0 THEN 'out_of_stock'
          WHEN $1 <= min_stock_level THEN 'low_stock'
          ELSE 'available'
        END,
        updated_at = NOW()
      WHERE id = $2 AND company_id = $3
      RETURNING *
    `;

    const result = await query(updateQuery, [newStock, id, companyId]);

    const updatedItem = {
      ...result.rows[0],
      current_stock: parseInt(result.rows[0].current_stock) || 0,
      min_stock_level: parseInt(result.rows[0].min_stock_level) || 0,
      max_stock_level: parseInt(result.rows[0].max_stock_level) || 0,
      unit_price: parseFloat(result.rows[0].unit_price) || 0,
      cost_price: result.rows[0].cost_price ? parseFloat(result.rows[0].cost_price) : null
    };

    res.json({
      success: true,
      data: updatedItem,
      message: `Stock level ${operation === 'set' ? 'updated' : operation === 'add' ? 'increased' : 'decreased'} successfully`
    } as ApiResponse);

  } catch (error) {
    console.error('Update stock level error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update stock level'
    } as ApiResponse);
  }
};

// Get inventory options for forms (categories, equipment types, etc.)
export const getInventoryOptions = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Get unique categories from parts
    const categoriesResult = await query(
      'SELECT DISTINCT category FROM parts WHERE company_id = $1 AND category IS NOT NULL ORDER BY category',
      [companyId]
    );

    // Get all equipment types for the company
    const equipmentTypesResult = await query(
      'SELECT id, name, brand, model, category FROM equipment_types WHERE company_id = $1 AND is_active = true ORDER BY brand, model',
      [companyId]
    );

    res.json({
      success: true,
      data: {
        categories: categoriesResult.rows.map(row => row.category),
        equipment_types: equipmentTypesResult.rows,
        statuses: ['available', 'low_stock', 'out_of_stock', 'discontinued']
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get inventory options error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get inventory options'
    } as ApiResponse);
  }
};

// Get low stock alerts
export const getLowStockAlerts = async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    const lowStockQuery = `
      SELECT
        id, part_number, name, current_stock, min_stock_level,
        CASE
          WHEN current_stock <= 0 THEN 'critical'
          WHEN current_stock <= min_stock_level THEN 'low'
          ELSE 'normal'
        END as alert_level
      FROM parts
      WHERE company_id = $1
        AND current_stock <= min_stock_level
        AND status != 'discontinued'
      ORDER BY
        CASE
          WHEN current_stock <= 0 THEN 1
          WHEN current_stock <= min_stock_level THEN 2
          ELSE 3
        END,
        current_stock ASC
    `;

    const result = await query(lowStockQuery, [companyId]);

    const alerts = result.rows.map(row => ({
      ...row,
      current_stock: parseInt(row.current_stock) || 0,
      min_stock_level: parseInt(row.min_stock_level) || 0
    }));

    res.json({
      success: true,
      data: {
        alerts,
        summary: {
          critical: alerts.filter(a => a.alert_level === 'critical').length,
          low: alerts.filter(a => a.alert_level === 'low').length,
          total: alerts.length
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get low stock alerts error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get low stock alerts'
    } as ApiResponse);
  }
};


