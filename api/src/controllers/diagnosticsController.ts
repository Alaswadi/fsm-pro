import { Request, Response } from 'express';
import { query } from '../config/database';
import { ApiResponse } from '../types';

/**
 * Diagnostic endpoint to check database health and table existence
 * This helps troubleshoot setup and deployment issues
 */
export const getDatabaseHealth = async (req: Request, res: Response) => {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        version: null,
      },
      tables: {
        total: 0,
        missing: [],
        existing: [],
      },
      data: {
        users: 0,
        companies: 0,
        technicians: 0,
      },
      status: 'unknown',
    };

    // Test database connection
    try {
      const versionResult = await query('SELECT version()');
      diagnostics.database.connected = true;
      diagnostics.database.version = versionResult.rows[0].version;
    } catch (error) {
      diagnostics.database.error = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        data: diagnostics,
      } as ApiResponse);
    }

    // Check for required tables
    const requiredTables = [
      'users',
      'companies',
      'technicians',
      'company_skills',
      'company_certifications',
      'customers',
      'equipment_types',
      'customer_equipment',
      'parts',
      'jobs',
      'job_parts',
      'job_photos',
      'notifications',
      'audit_logs',
      'mail_settings',
    ];

    const tableCheckResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    const existingTables = tableCheckResult.rows.map((row: any) => row.table_name);
    diagnostics.tables.total = existingTables.length;
    diagnostics.tables.existing = existingTables;

    // Find missing tables
    diagnostics.tables.missing = requiredTables.filter(
      (table) => !existingTables.includes(table)
    );

    // Count records in key tables
    try {
      const usersResult = await query('SELECT COUNT(*) as count FROM users');
      diagnostics.data.users = parseInt(usersResult.rows[0].count);
    } catch (error) {
      diagnostics.data.users = 'table_missing';
    }

    try {
      const companiesResult = await query('SELECT COUNT(*) as count FROM companies');
      diagnostics.data.companies = parseInt(companiesResult.rows[0].count);
    } catch (error) {
      diagnostics.data.companies = 'table_missing';
    }

    try {
      const techniciansResult = await query('SELECT COUNT(*) as count FROM technicians');
      diagnostics.data.technicians = parseInt(techniciansResult.rows[0].count);
    } catch (error) {
      diagnostics.data.technicians = 'table_missing';
    }

    // Determine overall status
    if (diagnostics.tables.missing.length === 0) {
      if (diagnostics.data.users > 0 && diagnostics.data.companies > 0) {
        diagnostics.status = 'healthy';
      } else {
        diagnostics.status = 'needs_setup';
      }
    } else {
      diagnostics.status = 'incomplete_schema';
    }

    // Add recommendations
    diagnostics.recommendations = [];
    
    if (diagnostics.tables.missing.length > 0) {
      diagnostics.recommendations.push(
        'Database schema is incomplete. Run database/init.sql to create missing tables.'
      );
    }
    
    if (diagnostics.data.users === 0 || diagnostics.data.companies === 0) {
      diagnostics.recommendations.push(
        'No users or companies found. Complete the setup wizard at /setup'
      );
    }

    if (diagnostics.data.users > 0 && diagnostics.data.companies > 0 && diagnostics.data.technicians === 0) {
      diagnostics.recommendations.push(
        'No technicians found. Admin users will use the first company for context.'
      );
    }

    return res.json({
      success: true,
      data: diagnostics,
    } as ApiResponse);
  } catch (error) {
    console.error('Database health check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to perform health check',
      details: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse);
  }
};

/**
 * Get detailed information about the current user's company context
 */
export const getCompanyContext = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      } as ApiResponse);
    }

    const context: any = {
      userId,
      userRole: null,
      isTechnician: false,
      technicianCompanyId: null,
      availableCompanies: [],
      currentCompany: req.company || null,
    };

    // Get user role
    const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length > 0) {
      context.userRole = userResult.rows[0].role;
    }

    // Check if user is a technician
    try {
      const techResult = await query(
        'SELECT company_id FROM technicians WHERE user_id = $1',
        [userId]
      );
      if (techResult.rows.length > 0) {
        context.isTechnician = true;
        context.technicianCompanyId = techResult.rows[0].company_id;
      }
    } catch (error) {
      context.technicianCheckError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Get all available companies
    try {
      const companiesResult = await query(
        'SELECT id, name, is_active FROM companies ORDER BY created_at'
      );
      context.availableCompanies = companiesResult.rows;
    } catch (error) {
      context.companiesCheckError = error instanceof Error ? error.message : 'Unknown error';
    }

    return res.json({
      success: true,
      data: context,
    } as ApiResponse);
  } catch (error) {
    console.error('Company context check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get company context',
      details: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse);
  }
};

