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

  try {
    // 1. Create Equipment Types (with brand and model as required by schema)
    console.log('[Setup] Creating equipment types...');
    const equipmentTypes = [
      { name: 'HVAC System', brand: 'Carrier', model: 'Infinity 24', description: 'High-efficiency heating and cooling system', category: 'HVAC' },
      { name: 'Furnace', brand: 'Trane', model: 'XC95m', description: 'Gas furnace with modulating heat', category: 'HVAC' },
      { name: 'Air Conditioner', brand: 'Lennox', model: 'XC25', description: 'Variable-capacity air conditioner', category: 'HVAC' },
      { name: 'Heat Pump', brand: 'Carrier', model: 'Greenspeed', description: 'Variable-speed heat pump system', category: 'HVAC' },
      { name: 'Water Heater', brand: 'Rheem', model: 'ProTerra', description: 'Hybrid electric water heater', category: 'Plumbing' },
      { name: 'Boiler', brand: 'Weil-McLain', model: 'Ultra', description: 'High-efficiency gas boiler', category: 'HVAC' },
      { name: 'Thermostat', brand: 'Honeywell', model: 'T6 Pro', description: 'Programmable smart thermostat', category: 'Controls' },
      { name: 'Air Handler', brand: 'Goodman', model: 'ARUF', description: 'Multi-position air handler', category: 'HVAC' },
      { name: 'Ductwork', brand: 'Hart & Cooley', model: 'FlexAir', description: 'Flexible duct system', category: 'HVAC' },
      { name: 'Refrigeration Unit', brand: 'True', model: 'T-49F', description: 'Commercial reach-in freezer', category: 'Refrigeration' },
    ];

    for (const equipType of equipmentTypes) {
      await client.query(
        `INSERT INTO equipment_types (company_id, name, brand, model, description, category, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())`,
        [companyId, equipType.name, equipType.brand, equipType.model, equipType.description, equipType.category]
      );
    }
    console.log('[Setup] ✓ Created', equipmentTypes.length, 'equipment types');

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
  console.log('[Setup] ✓ Created', certifications.length, 'certifications');

  // 4. Skip Sample Customers (table schema mismatch - will be added via UI)
  console.log('[Setup] ⚠ Skipping sample customers (add via UI after setup)');

  // 5. Skip Sample Parts/Inventory (table schema mismatch - will be added via UI)
  console.log('[Setup] ⚠ Skipping inventory parts (add via UI after setup)');

  console.log('[Setup] ✓ Demo data seeding completed successfully');
  } catch (error: any) {
    console.error('[Setup] ERROR during demo data seeding:', error);
    console.error('[Setup] Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      table: error.table,
      column: error.column,
      constraint: error.constraint
    });
    throw error; // Re-throw to rollback transaction
  }
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
        console.log('[Setup] Demo data requested, starting seeding process...');
        const startTime = Date.now();
        await seedDemoData(client, company.id);
        const duration = Date.now() - startTime;
        console.log(`[Setup] Demo data seeding completed in ${duration}ms`);
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
    console.error('[Setup] ERROR initializing setup:', error);
    console.error('[Setup] Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      table: error.table,
      column: error.column,
      constraint: error.constraint,
      stack: error.stack
    });

    // Check for unique constraint violations
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Email address already exists'
      } as ApiResponse);
    }

    // Check for NOT NULL constraint violations
    if (error.code === '23502') {
      return res.status(400).json({
        success: false,
        error: `Missing required field: ${error.column} in table ${error.table}`
      } as ApiResponse);
    }

    return res.status(500).json({
      success: false,
      error: `Failed to initialize setup: ${error.message || 'Unknown error'}`
    } as ApiResponse);
  }
};

