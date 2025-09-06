import { Router } from 'express';
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  getJobOptions,
  getCustomerEquipmentForJob,
  searchTechnicians,
  searchCustomers,
  searchEquipment
} from '../controllers/jobsController';
import { authenticateToken } from '../middleware/auth';
import { addCompanyContext, requireCompanyContext } from '../middleware/company';

const router = Router();

// All job routes require authentication and company context
router.use(authenticateToken);
router.use(addCompanyContext);

// GET /api/jobs/options - Get available options for job forms
router.get('/options', requireCompanyContext, getJobOptions);

// GET /api/jobs/search/technicians - Search technicians (temporarily without company context requirement)
router.get('/search/technicians', searchTechnicians);

// GET /api/jobs/search/customers - Search customers
router.get('/search/customers', requireCompanyContext, searchCustomers);

// GET /api/jobs/search/equipment - Search equipment
router.get('/search/equipment', requireCompanyContext, searchEquipment);

// GET /api/jobs/customer/:customer_id/equipment - Get equipment for specific customer
router.get('/customer/:customer_id/equipment', requireCompanyContext, getCustomerEquipmentForJob);

// GET /api/jobs - Get all jobs with pagination and filtering
router.get('/', requireCompanyContext, getJobs);

// GET /api/jobs/:id - Get single job by ID
router.get('/:id', requireCompanyContext, getJob);

// POST /api/jobs - Create new job (temporarily without company context requirement)
router.post('/', createJob);

// PUT /api/jobs/:id - Update job
router.put('/:id', requireCompanyContext, updateJob);

// PATCH /api/jobs/:id/status - Update job status
router.patch('/:id/status', requireCompanyContext, updateJobStatus);

// DELETE /api/jobs/:id - Delete job
router.delete('/:id', requireCompanyContext, deleteJob);

export default router;
