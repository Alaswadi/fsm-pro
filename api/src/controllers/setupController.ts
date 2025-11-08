import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, transaction } from '../config/database';
import { ApiResponse } from '../types';

/**
 * Check if setup is needed
 * Returns true if no users exist in the database
 */
export const checkSetupNeeded = async (req: Request, res: Response) => {
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
      dateFormat
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

      // Create the company
      const companyResult = await client.query(
        `INSERT INTO companies (name, address, phone, email, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())
         RETURNING id, name, email`,
        [companyName, companyAddress || '', companyPhone || '', companyEmail || adminEmail]
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

      // Create company settings if configuration provided
      if (timezone || currency || dateFormat) {
        await client.query(
          `INSERT INTO company_settings (company_id, timezone, currency, date_format, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           ON CONFLICT (company_id) DO UPDATE
           SET timezone = EXCLUDED.timezone,
               currency = EXCLUDED.currency,
               date_format = EXCLUDED.date_format,
               updated_at = NOW()`,
          [
            company.id,
            timezone || 'America/New_York',
            currency || 'USD',
            dateFormat || 'MM/DD/YYYY'
          ]
        );
      }

      return {
        company,
        user
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Setup completed successfully',
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
        }
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

