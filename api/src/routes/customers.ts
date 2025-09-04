import { Router } from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus
} from '../controllers/customersController';
import { authenticateToken } from '../middleware/auth';
import { addCompanyContext, requireCompanyContext } from '../middleware/company';

const router = Router();

// All customer routes require authentication and company context
router.use(authenticateToken);
router.use(addCompanyContext);
router.use(requireCompanyContext);

// GET /api/customers - Get all customers with pagination and filtering
router.get('/', getCustomers);

// GET /api/customers/:id - Get single customer by ID
router.get('/:id', getCustomer);

// POST /api/customers - Create new customer
router.post('/', createCustomer);

// PUT /api/customers/:id - Update customer
router.put('/:id', updateCustomer);

// DELETE /api/customers/:id - Delete (deactivate) customer
router.delete('/:id', deleteCustomer);

// PATCH /api/customers/:id/status - Toggle customer status
router.patch('/:id/status', toggleCustomerStatus);

export default router;
