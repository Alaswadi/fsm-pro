import { Router } from 'express';
import {
    getWorkOrderTrends,
    getRevenueTrends,
    getTechnicianPerformance,
    getTopCustomers,
    getEquipmentAnalytics
} from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';
import { addCompanyContext, requireCompanyContext } from '../middleware/company';

const router = Router();

// All analytics routes require authentication and company context
router.use(authenticateToken);
router.use(addCompanyContext);
router.use(requireCompanyContext);

// GET /api/analytics/work-order-trends - Get weekly work order trends
router.get('/work-order-trends', getWorkOrderTrends);

// GET /api/analytics/revenue-trends - Get monthly revenue trends
router.get('/revenue-trends', getRevenueTrends);

// GET /api/analytics/technician-performance - Get technician performance metrics
router.get('/technician-performance', getTechnicianPerformance);

// GET /api/analytics/top-customers - Get top customers by work orders
router.get('/top-customers', getTopCustomers);

// GET /api/analytics/equipment - Get equipment analytics
router.get('/equipment', getEquipmentAnalytics);

export default router;
