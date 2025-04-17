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

// Route đăng nhập cho sinh viên
router.post('/login', (req, res) => {
  // Xử lý đăng nhập tạm thời
  const { studentId, password } = req.body;
  
  // Trả về token giả để test frontend
  res.json({
    token: 'test-token-for-student',
    id: '123',
    name: 'Sinh viên Test',
    studentId: studentId
  });
});

// Route có bảo vệ
router.post('/', checkAuth, createStudent);
router.put('/:id', checkAuth, updateStudent);
router.delete('/:id', checkAuth, deleteStudent);

export default router;
