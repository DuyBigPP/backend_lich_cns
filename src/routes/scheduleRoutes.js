import express from 'express';
import { getScheduleByStudentId, sendScheduleNotification } from '../controllers/scheduleController.js';
import { checkAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Lấy lịch học của sinh viên
router.get('/student/:studentId', getScheduleByStudentId);

// Gửi thông báo lịch học (yêu cầu xác thực)
router.post('/notify/:studentId', checkAuth, sendScheduleNotification);

export default router; 