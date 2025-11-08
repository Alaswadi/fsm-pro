import { Router } from 'express';
import { getDatabaseHealth, getCompanyContext } from '../controllers/diagnosticsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public health check endpoint (no auth required)
router.get('/health', getDatabaseHealth);

// Protected company context check (requires auth)
router.get('/company-context', authenticateToken, getCompanyContext);

export default router;

