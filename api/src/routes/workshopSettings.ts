import { Router } from 'express';
import {
  getWorkshopSettings,
  updateWorkshopSettings
} from '../controllers/workshopSettingsController';
import { authenticateToken } from '../middleware/auth';
import { addCompanyContext, requireCompanyContext } from '../middleware/company';

const router = Router();

// All workshop settings routes require authentication and company context
router.use(authenticateToken);
router.use(addCompanyContext);

// GET /api/workshop/settings - Get workshop settings for the company
router.get('/', requireCompanyContext, getWorkshopSettings);

// PUT /api/workshop/settings - Update workshop settings
router.put('/', requireCompanyContext, updateWorkshopSettings);

export default router;
