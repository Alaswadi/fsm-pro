import express from 'express';
import { 
  getJobInvoice, 
  calculateAndUpdateJobTotal, 
  checkJobInvoiceReady,
  getJobsReadyForInvoicing 
} from '../controllers/invoiceController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All invoice routes require authentication
router.use(authenticateToken);

// Get list of jobs ready for invoicing
router.get('/ready', getJobsReadyForInvoicing);

// Check if a specific job is ready for invoicing
router.get('/job/:job_id/ready', checkJobInvoiceReady);

// Get invoice data for a job
router.get('/job/:job_id', getJobInvoice);

// Calculate and update job total cost
router.post('/job/:job_id/calculate', calculateAndUpdateJobTotal);

export default router;
