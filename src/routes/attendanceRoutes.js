import express from 'express';
import { 
  getStudentAttendance, 
  createOrUpdateAttendance,
  getAttendanceStats 
} from '../controllers/attendanceController.js';
import { checkAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Lấy danh sách điểm danh của sinh viên
router.get('/student/:studentId', checkAuth, getStudentAttendance);

// Tạo mới hoặc cập nhật điểm danh
router.post('/student/:studentId', checkAuth, createOrUpdateAttendance);

// Lấy thống kê điểm danh của sinh viên
router.get('/stats/:studentId', checkAuth, getAttendanceStats);

export default router;
