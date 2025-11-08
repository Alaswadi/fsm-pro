import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';

/**
 * Middleware to check if setup is needed
 * Blocks access to setup routes if users already exist
 */
export const blockSetupIfComplete = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only apply to setup initialization endpoint
    if (req.path === '/initialize' && req.method === 'POST') {
      const userResult = await query('SELECT COUNT(*) as count FROM users');
      const userCount = parseInt(userResult.rows[0].count);

      if (userCount > 0) {
        return res.status(403).json({
          success: false,
          error: 'Setup has already been completed. Cannot reinitialize.'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error in setup check middleware:', error);
    next(error);
  }
};

