import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { addCompanyContext, requireCompanyContext } from '../middleware/company';
import {
  createIntake,
  getIntake,
  updateIntake,
  uploadIntakePhotos,
  uploadIntakePhotosMiddleware,
  getIntakePhotos
} from '../controllers/intakeController';

const router = express.Router();

// All routes require authentication and company context
router.use(authenticateToken);
router.use(addCompanyContext);
router.use(requireCompanyContext);

// POST /api/workshop/intake - Create equipment intake record
router.post('/', createIntake);

// GET /api/workshop/intake/:job_id - Get intake record by job ID
router.get('/:job_id', getIntake);

// PUT /api/workshop/intake/:id - Update intake record
router.put('/:id', updateIntake);

// POST /api/workshop/intake/:id/photos - Upload intake photos
router.post('/:id/photos', uploadIntakePhotosMiddleware, uploadIntakePhotos);

// GET /api/workshop/intake/:id/photos - Get intake photos
router.get('/:id/photos', getIntakePhotos);

export default router;
