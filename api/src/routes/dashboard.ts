import { Router } from 'express';
import {
  getDashboardStats,
  getRecentActivities,
  getWorkOrderStatusBreakdown
} from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';
import { addCompanyContext, requireCompanyContext } from '../middleware/company';

const router = Router();

// All dashboard routes require authentication and company context
router.use(authenticateToken);
router.use(addCompanyContext);
router.use(requireCompanyContext);

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', getDashboardStats);

// GET /api/dashboard/activities - Get recent activities
router.get('/activities', getRecentActivities);

// GET /api/dashboard/work-order-status - Get work order status breakdown for chart
router.get('/work-order-status', getWorkOrderStatusBreakdown);

export default router;

