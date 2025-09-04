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
    
    if (!userId) {
      return next(); // Let other middleware handle authentication
    }

    // First check if user is a technician
    const techResult = await query(
      'SELECT t.company_id, c.name FROM technicians t JOIN companies c ON t.company_id = c.id WHERE t.user_id = $1',
      [userId]
    );
    
    if (techResult.rows.length > 0) {
      req.company = {
        id: techResult.rows[0].company_id,
        name: techResult.rows[0].name
      };
      return next();
    }
    
    // If not a technician, check if user is an admin/manager and get the first company
    const userResult = await query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length > 0) {
      const userRole = userResult.rows[0].role;
      
      if (['super_admin', 'admin', 'manager'].includes(userRole)) {
        // For admin users, get the first company (in a real multi-tenant system, 
        // this would be based on user's company assignment)
        const companyResult = await query(
          'SELECT id, name FROM companies WHERE is_active = true ORDER BY created_at LIMIT 1'
        );
        
        if (companyResult.rows.length > 0) {
          req.company = {
            id: companyResult.rows[0].id,
            name: companyResult.rows[0].name
          };
        }
      }
    }
    
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
