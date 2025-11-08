import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';

// Extend Request interface to include company context
declare global {
  namespace Express {
    interface Request {
      company?: {
        id: string;
        name: string;
      };
    }
  }
}

// Middleware to add company context to requests
export const addCompanyContext = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;

    console.log('[Company Middleware] User ID:', userId);

    if (!userId) {
      console.log('[Company Middleware] No user ID found, skipping');
      return next(); // Let other middleware handle authentication
    }

    // Get user role first
    const userResult = await query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    console.log('[Company Middleware] User role check:', userResult.rows.length > 0 ? userResult.rows[0].role : 'none');

    if (userResult.rows.length === 0) {
      console.log('[Company Middleware] User not found');
      return next();
    }

    const userRole = userResult.rows[0].role;

    // For technicians, try to get company from technicians table
    if (userRole === 'technician') {
      try {
        const techResult = await query(
          'SELECT t.company_id, c.name FROM technicians t JOIN companies c ON t.company_id = c.id WHERE t.user_id = $1',
          [userId]
        );

        console.log('[Company Middleware] Technician check result:', techResult.rows.length);

        if (techResult.rows.length > 0) {
          req.company = {
            id: techResult.rows[0].company_id,
            name: techResult.rows[0].name
          };
          console.log('[Company Middleware] Set company from technician:', req.company);
          return next();
        }
      } catch (techError) {
        console.error('[Company Middleware] Error checking technician:', techError);
        // Continue to admin fallback
      }
    }

    // For admin/manager/super_admin users, get the first active company
    if (['super_admin', 'admin', 'manager'].includes(userRole)) {
      try {
        const companyResult = await query(
          'SELECT id, name FROM companies WHERE is_active = true ORDER BY created_at LIMIT 1'
        );

        console.log('[Company Middleware] Company query result:', companyResult.rows.length);

        if (companyResult.rows.length > 0) {
          req.company = {
            id: companyResult.rows[0].id,
            name: companyResult.rows[0].name
          };
          console.log('[Company Middleware] Set company from admin:', req.company);
        } else {
          console.log('[Company Middleware] No active companies found');
        }
      } catch (companyError) {
        console.error('[Company Middleware] Error fetching company:', companyError);
      }
    }

    console.log('[Company Middleware] Final company context:', req.company);
    next();
  } catch (error) {
    console.error('Company context middleware error:', error);
    next(); // Continue without company context
  }
};

// Middleware to require company context
export const requireCompanyContext = (req: Request, res: Response, next: NextFunction) => {
  if (!req.company) {
    return res.status(403).json({
      success: false,
      error: 'No company context found. User must be associated with a company.'
    });
  }
  next();
};
