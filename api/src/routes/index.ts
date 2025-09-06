import { Router } from 'express';
import authRoutes from './auth';
import techniciansRoutes from './technicians';
import customersRoutes from './customers';
import settingsRoutes from './settings';
import equipmentRoutes from './equipment';
import inventoryRoutes from './inventory';
import uploadRoutes from './upload';
import jobsRoutes from './jobs';
import dashboardRoutes from './dashboard';
import { query } from '../config/database';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'FSM API is running',
    timestamp: new Date().toISOString()
  });
});

// Database health check
router.get('/health/db', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as current_time, COUNT(*) as company_count FROM companies');
    res.json({
      success: true,
      message: 'Database connection is healthy',
      data: {
        current_time: result.rows[0].current_time,
        company_count: result.rows[0].company_count
      }
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/technicians', techniciansRoutes);
router.use('/customers', customersRoutes);
router.use('/settings', settingsRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/upload', uploadRoutes);
router.use('/jobs', jobsRoutes);

export default router;
