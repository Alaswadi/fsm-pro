import { Router } from 'express';
import {
  getCompanyProfile,
  updateCompanyProfile,
  getCompanySkills,
  createCompanySkill,
  updateCompanySkill,
  deleteCompanySkill,
  getCompanyCertifications,
  createCompanyCertification,
  updateCompanyCertification,
  deleteCompanyCertification
} from '../controllers/settingsController';
import { authenticateToken } from '../middleware/auth';
import { addCompanyContext, requireCompanyContext } from '../middleware/company';

const router = Router();

// All settings routes require authentication and company context
router.use(authenticateToken);
router.use(addCompanyContext);
router.use(requireCompanyContext);

// Company profile routes
router.get('/company', getCompanyProfile);
router.put('/company', updateCompanyProfile);

// Skills management routes
router.get('/skills', getCompanySkills);
router.post('/skills', createCompanySkill);
router.put('/skills/:id', updateCompanySkill);
router.delete('/skills/:id', deleteCompanySkill);

// Certifications management routes
router.get('/certifications', getCompanyCertifications);
router.post('/certifications', createCompanyCertification);
router.put('/certifications/:id', updateCompanyCertification);
router.delete('/certifications/:id', deleteCompanyCertification);

export default router;
