import express from 'express';
import { 
  getAllStudents, 
  getStudentById,
  getStudentByStudentId,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/studentController.js';
import { checkAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route công khai
router.get('/', getAllStudents);
router.get('/:id', getStudentById);
router.get('/studentId/:studentId', getStudentByStudentId);

// Route có bảo vệ
router.post('/', checkAuth, createStudent);
router.put('/:id', checkAuth, updateStudent);
router.delete('/:id', checkAuth, deleteStudent);

export default router;
