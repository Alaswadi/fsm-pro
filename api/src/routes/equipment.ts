import { Router } from 'express';
import {
  // Equipment Types
  getEquipmentTypes,
  getEquipmentType,
  createEquipmentType,
  updateEquipmentType,
  deleteEquipmentType,

  // Customer Equipment
  getCustomerEquipment,
  getCustomerEquipmentById,
  createCustomerEquipment,
  updateCustomerEquipment,
  deleteCustomerEquipment,

  // Utility
  getEquipmentOptions
} from '../controllers/equipmentController';
import { authenticateToken } from '../middleware/auth';
import { addCompanyContext, requireCompanyContext } from '../middleware/company';

const router = Router();

// All equipment routes require authentication and company context
router.use(authenticateToken);
router.use(addCompanyContext);
router.use(requireCompanyContext);

// Equipment options route (for form dropdowns)
router.get('/options', getEquipmentOptions);

// Equipment Types routes
router.get('/types', getEquipmentTypes);
router.get('/types/:id', getEquipmentType);
router.post('/types', createEquipmentType);
router.put('/types/:id', updateEquipmentType);
router.delete('/types/:id', deleteEquipmentType);

// Customer Equipment routes
router.get('/customer-equipment', getCustomerEquipment);
router.get('/customer-equipment/:id', getCustomerEquipmentById);
router.post('/customer-equipment', createCustomerEquipment);
router.put('/customer-equipment/:id', updateCustomerEquipment);
router.delete('/customer-equipment/:id', deleteCustomerEquipment);

export default router;
