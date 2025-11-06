import { Router } from 'express';
import {
  getWorkshopJobs,
  getWorkshopQueue,
  claimJob,
  markReadyForPickup,
  scheduleDelivery,
  markEquipmentReturned,
  getWorkshopMetrics,
  getWorkshopCapacity
} from '../controllers/workshopController';
import { authenticateToken } from '../middleware/auth';
import { addCompanyContext, requireCompanyContext } from '../middleware/company';

const router = Router();

// All workshop routes require authentication and company context
router.use(authenticateToken);
router.use(addCompanyContext);

// GET /api/workshop/jobs - Get all workshop jobs
router.get('/jobs', requireCompanyContext, getWorkshopJobs);

// GET /api/workshop/queue - Get workshop repair queue
router.get('/queue', requireCompanyContext, getWorkshopQueue);

// POST /api/workshop/jobs/:id/claim - Claim job from queue
router.post('/jobs/:id/claim', requireCompanyContext, claimJob);

// POST /api/workshop/jobs/:id/ready-for-pickup - Mark equipment ready for pickup
router.post('/jobs/:id/ready-for-pickup', requireCompanyContext, markReadyForPickup);

// POST /api/workshop/jobs/:id/schedule-delivery - Schedule delivery
router.post('/jobs/:id/schedule-delivery', requireCompanyContext, scheduleDelivery);

// POST /api/workshop/jobs/:id/mark-returned - Mark equipment as returned
router.post('/jobs/:id/mark-returned', requireCompanyContext, markEquipmentReturned);

// GET /api/workshop/metrics - Get workshop metrics
router.get('/metrics', requireCompanyContext, getWorkshopMetrics);

// GET /api/workshop/capacity - Get workshop capacity utilization
router.get('/capacity', requireCompanyContext, getWorkshopCapacity);

export default router;
