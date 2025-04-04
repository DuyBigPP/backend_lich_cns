import express from 'express';
import { 
  getAllPositions, 
  getPositionById, 
  createPosition, 
  updatePosition, 
  deletePosition 
} from '../controllers/positionController.js';
import { checkAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route công khai
router.get('/', getAllPositions);
router.get('/:id', getPositionById);

// Route có bảo vệ
router.post('/', checkAuth, createPosition);
router.put('/:id', checkAuth, updatePosition);
router.delete('/:id', checkAuth, deletePosition);

export default router; 