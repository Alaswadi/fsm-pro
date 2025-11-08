import express from 'express';
import { checkSetupNeeded, initializeSetup } from '../controllers/setupController';
import { blockSetupIfComplete } from '../middleware/setupCheck';

const router = express.Router();

// Apply middleware to all setup routes
router.use(blockSetupIfComplete);

/**
 * @route   GET /api/setup/check
 * @desc    Check if setup is needed
 * @access  Public (no authentication required)
 */
router.get('/check', checkSetupNeeded);

/**
 * @route   POST /api/setup/initialize
 * @desc    Initialize the system with first admin user and company
 * @access  Public (only works if no users exist)
 */
router.post('/initialize', initializeSetup);

export default router;

