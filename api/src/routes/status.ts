import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { addCompanyContext, requireCompanyContext } from '../middleware/company';
import {
  getEquipmentStatus,
  updateStatus,
  getStatusHistory
} from '../controllers/statusController';

const router = express.Router();

// All routes require authentication and company context
router.use(authenticateToken);
router.use(addCompanyContext);
router.use(requireCompanyContext);

// GET /api/workshop/status/:job_id - Get current equipment status
router.get('/:job_id', getEquipmentStatus);

// PUT /api/workshop/status/:job_id - Update equipment status
router.put('/:job_id', updateStatus);

// GET /api/workshop/status/:job_id/history - Get status history
router.get('/:job_id/history', getStatusHistory);

export default router;
