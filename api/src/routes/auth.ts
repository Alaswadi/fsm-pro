import { Router } from 'express';
import {
  login,
  register,
  logout,
  getProfile,
  initiatePasswordReset,
  completePasswordReset,
  adminInitiatePasswordReset
} from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  passwordResetLimiter,
  adminPasswordResetLimiter,
  passwordResetCompletionLimiter
} from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);

// Password reset routes (public) with rate limiting
router.post('/reset-password', passwordResetLimiter, initiatePasswordReset);
router.post('/reset-password/confirm', passwordResetCompletionLimiter, completePasswordReset);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

// Admin-only routes with rate limiting
router.post('/reset-password/admin/:technicianId', authenticateToken, requireAdmin, adminPasswordResetLimiter, adminInitiatePasswordReset);

export default router;
