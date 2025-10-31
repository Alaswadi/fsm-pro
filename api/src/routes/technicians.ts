import { Router } from 'express';
import {
  getTechnicians,
  getTechnician,
  createTechnician,
  updateTechnician,
  deleteTechnician,
  toggleAvailability,
  getTechnicianOptions
} from '../controllers/techniciansController';
import { authenticateToken } from '../middleware/auth';
import { addCompanyContext, requireCompanyContext } from '../middleware/company';

const router = Router();

// All technician routes require authentication and company context
router.use(authenticateToken);
router.use(addCompanyContext);
router.use(requireCompanyContext);

// GET /api/technicians/options - Get available skills and certifications
router.get('/options', getTechnicianOptions);

// GET /api/technicians - Get all technicians with pagination and filtering
router.get('/', getTechnicians);

// GET /api/technicians/:id - Get single technician by ID
router.get('/:id', getTechnician);

// POST /api/technicians - Create new technician
router.post('/', createTechnician);

// PUT /api/technicians/:id - Update technician
router.put('/:id', updateTechnician);

// DELETE /api/technicians/:id - Delete (deactivate) technician
router.delete('/:id', deleteTechnician);

// PATCH /api/technicians/:id/availability - Toggle technician availability
router.patch('/:id/availability', toggleAvailability);

export default router;
