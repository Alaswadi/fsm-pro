import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, transaction } from '../config/database';
import { ApiResponse } from '../types';

/**
 * Seed demo data for a new company
 * Creates sample equipment types, customers, and other essential data
 */
async function seedDemoData(client: any, companyId: string) {
  console.log('[Setup] Seeding demo data for company:', companyId);

  // 1. Create Equipment Types
  const equipmentTypes = [
    { name: 'HVAC System', description: 'Heating, Ventilation, and Air Conditioning systems', category: 'HVAC' },
    { name: 'Furnace', description: 'Gas or electric heating furnaces', category: 'HVAC' },
    { name: 'Air Conditioner', description: 'Central air conditioning units', category: 'HVAC' },
    { name: 'Heat Pump', description: 'Heat pump systems for heating and cooling', category: 'HVAC' },
    { name: 'Water Heater', description: 'Residential and commercial water heaters', category: 'Plumbing' },
    { name: 'Boiler', description: 'Hot water or steam boilers', category: 'HVAC' },
    { name: 'Thermostat', description: 'Digital and programmable thermostats', category: 'Controls' },
    { name: 'Air Handler', description: 'Indoor air handling units', category: 'HVAC' },
    { name: 'Ductwork', description: 'HVAC duct systems', category: 'HVAC' },
    { name: 'Refrigeration Unit', description: 'Commercial refrigeration equipment', category: 'Refrigeration' },
  ];

  for (const equipType of equipmentTypes) {
    await client.query(
      `INSERT INTO equipment_types (company_id, name, description, category, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
      [companyId, equipType.name, equipType.description, equipType.category]
    );
  }
  console.log('[Setup] Created', equipmentTypes.length, 'equipment types');

  // 2. Create Company Skills
  const skills = [
    { name: 'HVAC Installation', description: 'Install new HVAC systems', category: 'Installation' },
    { name: 'HVAC Repair', description: 'Repair and troubleshoot HVAC issues', category: 'Repair' },
    { name: 'Preventive Maintenance', description: 'Routine maintenance and inspections', category: 'Maintenance' },
    { name: 'Electrical Work', description: 'Electrical repairs and installations', category: 'Electrical' },
    { name: 'Plumbing', description: 'Plumbing repairs and installations', category: 'Plumbing' },
    { name: 'Refrigeration', description: 'Commercial refrigeration service', category: 'Refrigeration' },
    { name: 'Duct Cleaning', description: 'Air duct cleaning and sanitization', category: 'Cleaning' },
    { name: 'Energy Audit', description: 'Energy efficiency assessments', category: 'Consulting' },
  ];

  for (const skill of skills) {
    await client.query(
      `INSERT INTO company_skills (company_id, name, description, category, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
      [companyId, skill.name, skill.description, skill.category]
    );
  }
  console.log('[Setup] Created', skills.length, 'company skills');

  // 3. Create Company Certifications
  const certifications = [
    { name: 'EPA 608 Certification', description: 'EPA certification for refrigerant handling', issuing_organization: 'EPA', validity_period_months: 0, renewal_required: false },
    { name: 'NATE Certification', description: 'North American Technician Excellence certification', issuing_organization: 'NATE', validity_period_months: 24, renewal_required: true },
    { name: 'OSHA Safety Training', description: 'Occupational Safety and Health Administration training', issuing_organization: 'OSHA', validity_period_months: 12, renewal_required: true },
    { name: 'Journeyman License', description: 'State journeyman HVAC license', issuing_organization: 'State Licensing Board', validity_period_months: 24, renewal_required: true },
    { name: 'Master HVAC License', description: 'State master HVAC license', issuing_organization: 'State Licensing Board', validity_period_months: 24, renewal_required: true },
  ];

  for (const cert of certifications) {
    await client.query(
      `INSERT INTO company_certifications (company_id, name, description, issuing_organization, validity_period_months, renewal_required, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())`,
      [companyId, cert.name, cert.description, cert.issuing_organization, cert.validity_period_months, cert.renewal_required]
    );
  }
  console.log('[Setup] Created', certifications.length, 'certifications');

  // 4. Create Sample Customers
  const customers = [
    {
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@example.com',
      phone: '555-0101',
      address: '123 Main Street',
      city: 'Springfield',
      state: 'IL',
      zip_code: '62701',
      customer_type: 'residential',
    },
    {
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '555-0102',
      address: '456 Oak Avenue',
      city: 'Springfield',
      state: 'IL',
      zip_code: '62702',
      customer_type: 'residential',
    },
    {
      company_name: 'Acme Corporation',
      first_name: 'Michael',
      last_name: 'Brown',
      email: 'facilities@acmecorp.com',
      phone: '555-0103',
      address: '789 Business Park Drive',
      city: 'Springfield',
      state: 'IL',
      zip_code: '62703',
      customer_type: 'commercial',
    },
  ];

  for (const customer of customers) {
    await client.query(
      `INSERT INTO customers (
        company_id, first_name, last_name, email, phone, address, city, state, zip_code,
        customer_type, company_name, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), NOW())`,
      [
        companyId,
        customer.first_name,
        customer.last_name,
        customer.email,
        customer.phone,
        customer.address,
        customer.city,
        customer.state,
        customer.zip_code,
        customer.customer_type,
        customer.company_name || null,
      ]
    );
  }
  console.log('[Setup] Created', customers.length, 'sample customers');

  // 5. Create Sample Parts/Inventory
  const parts = [
    { name: 'Air Filter (16x20x1)', sku: 'AF-16201', category: 'Filters', unit_price: 12.99, quantity_in_stock: 50, reorder_level: 10 },
    { name: 'Air Filter (20x25x1)', sku: 'AF-20251', category: 'Filters', unit_price: 15.99, quantity_in_stock: 40, reorder_level: 10 },
    { name: 'Capacitor 45/5 MFD', sku: 'CAP-455', category: 'Electrical', unit_price: 24.99, quantity_in_stock: 25, reorder_level: 5 },
    { name: 'Contactor 30A', sku: 'CONT-30A', category: 'Electrical', unit_price: 35.99, quantity_in_stock: 15, reorder_level: 5 },
    { name: 'Thermostat Wire 18/8', sku: 'WIRE-188', category: 'Wiring', unit_price: 45.00, quantity_in_stock: 10, reorder_level: 3 },
    { name: 'Refrigerant R410A (25lb)', sku: 'REF-410A', category: 'Refrigerant', unit_price: 350.00, quantity_in_stock: 8, reorder_level: 2 },
    { name: 'Condensate Pump', sku: 'PUMP-COND', category: 'Pumps', unit_price: 89.99, quantity_in_stock: 12, reorder_level: 3 },
    { name: 'Blower Motor 1/2 HP', sku: 'MOTOR-BL12', category: 'Motors', unit_price: 275.00, quantity_in_stock: 5, reorder_level: 2 },
  ];

  for (const part of parts) {
    await client.query(
      `INSERT INTO parts (
        company_id, name, sku, category, unit_price, quantity_in_stock, reorder_level,
        is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())`,
      [companyId, part.name, part.sku, part.category, part.unit_price, part.quantity_in_stock, part.reorder_level]
    );
  }
  console.log('[Setup] Created', parts.length, 'inventory items');

  console.log('[Setup] Demo data seeding completed successfully');
}

/**
 * Check if setup is needed
 * Returns true if no users exist in the database
 */
export const checkSetupNeeded = async (_req: Request, res: Response) => {
  try {
    // Check if any users exist
    const userResult = await query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userResult.rows[0].count);

    // Check if any companies exist
    const companyResult = await query('SELECT COUNT(*) as count FROM companies');
    const companyCount = parseInt(companyResult.rows[0].count);

    const setupNeeded = userCount === 0 && companyCount === 0;

    return res.status(200).json({
      success: true,
      data: {
        setupNeeded,
        userCount,
        companyCount
      }
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error checking setup status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check setup status'
    } as ApiResponse);
  }
};

/**
 * Initialize the system with first admin user and company
 */
export const initializeSetup = async (req: Request, res: Response) => {
  try {
    const {
      // Admin user details
      adminEmail,
      adminPassword,
      adminFullName,
      adminPhone,

      // Company details
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,

      // Optional configuration
      timezone,
      currency,
      dateFormat,

      // Demo data option
      includeDemoData
    } = req.body;

    // Validate required fields
    if (!adminEmail || !adminPassword || !adminFullName || !companyName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: adminEmail, adminPassword, adminFullName, companyName'
      } as ApiResponse);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      } as ApiResponse);
    }

    // Validate password strength (minimum 8 characters)
    if (adminPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      } as ApiResponse);
    }

    // Check if setup has already been completed
    const userResult = await query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userResult.rows[0].count);

    if (userCount > 0) {
      return res.status(403).json({
        success: false,
        error: 'Setup has already been completed. Cannot reinitialize.'
      } as ApiResponse);
    }

    // Use transaction to ensure atomicity
    const result = await transaction(async (client) => {
      // Hash the password
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      // Create the company with configuration settings
      const companyResult = await client.query(
        `INSERT INTO companies (name, address, phone, email, timezone, currency, date_format, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
         RETURNING id, name, email, timezone, currency, date_format`,
        [
          companyName,
          companyAddress || '',
          companyPhone || '',
          companyEmail || adminEmail,
          timezone || 'America/New_York',
          currency || 'USD',
          dateFormat || 'MM/DD/YYYY'
        ]
      );

      const company = companyResult.rows[0];

      // Create the admin user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, full_name, phone, role, is_active, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'admin', true, true, NOW(), NOW())
         RETURNING id, email, full_name, role`,
        [adminEmail, passwordHash, adminFullName, adminPhone || '']
      );

      const user = userResult.rows[0];

      // Seed demo data if requested
      if (includeDemoData === true) {
        console.log('[Setup] Demo data requested, seeding...');
        await seedDemoData(client, company.id);
      } else {
        console.log('[Setup] Demo data not requested, skipping seeding');
      }

      return {
        company,
        user,
        demoDataSeeded: includeDemoData === true
      };
    });

    return res.status(201).json({
      success: true,
      message: result.demoDataSeeded
        ? 'Setup completed successfully with demo data'
        : 'Setup completed successfully',
      data: {
        company: {
          id: result.company.id,
          name: result.company.name,
          email: result.company.email
        },
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.full_name,
          role: result.user.role
        },
        demoDataSeeded: result.demoDataSeeded
      }
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error initializing setup:', error);
    
    // Check for unique constraint violations
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Email address already exists'
      } as ApiResponse);
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to initialize setup'
    } as ApiResponse);
  }
};

