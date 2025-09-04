import { Router } from 'express';
import { 
  uploadSingle, 
  uploadEquipmentImage, 
  deleteEquipmentImage, 
  getImageInfo 
} from '../controllers/uploadController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All upload routes require authentication
router.use(authenticateToken);

// Equipment image upload
router.post('/equipment-image', uploadSingle, uploadEquipmentImage);

// Delete equipment image
router.delete('/equipment-image/:filename', deleteEquipmentImage);

// Get image info
router.get('/equipment-image/:filename', getImageInfo);

export default router;
