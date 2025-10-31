import { Router } from 'express';
import {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  updateStockLevel,
  getInventoryOptions,
  getLowStockAlerts
} from '../controllers/inventoryController';
import { authenticateToken } from '../middleware/auth';
import { addCompanyContext, requireCompanyContext } from '../middleware/company';

const router = Router();

// All inventory routes require authentication and company context
router.use(authenticateToken);
router.use(addCompanyContext);
router.use(requireCompanyContext);

// GET /api/inventory/options - Get inventory options for forms
router.get('/options', getInventoryOptions);

// GET /api/inventory/alerts - Get low stock alerts
router.get('/alerts', getLowStockAlerts);

// GET /api/inventory - Get all inventory items with pagination and filtering
router.get('/', getInventoryItems);

// GET /api/inventory/:id - Get single inventory item by ID
router.get('/:id', getInventoryItem);

// POST /api/inventory - Create new inventory item
router.post('/', createInventoryItem);

// PUT /api/inventory/:id - Update inventory item
router.put('/:id', updateInventoryItem);

// PATCH /api/inventory/:id/stock - Update stock level
router.patch('/:id/stock', updateStockLevel);

// DELETE /api/inventory/:id - Delete inventory item
router.delete('/:id', deleteInventoryItem);

export default router;
