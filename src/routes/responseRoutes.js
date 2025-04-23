import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  createStudentResponse,
  getResponses,
  getResponseDetail,
  updateResponseStatus,
  deleteAttachment
} from '../controllers/responseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Cấu hình lưu trữ file
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads/responses'));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // giới hạn 10MB
  }
});

// Đường dẫn: /api/responses

// Tạo phản hồi cho một thông báo (cho sinh viên)
router.post('/notification/:notificationId', 
  authMiddleware, 
  upload.array('attachments', 5), // Tối đa 5 file
  createStudentResponse
);

// Lấy danh sách phản hồi (cho admin)
router.get('/', authMiddleware, adminMiddleware, getResponses);

// Lấy chi tiết phản hồi
router.get('/:responseId', authMiddleware, getResponseDetail);

// Cập nhật trạng thái phản hồi (cho admin)
router.patch('/:responseId/status', authMiddleware, adminMiddleware, updateResponseStatus);

// Xóa tệp đính kèm
router.delete('/attachment/:attachmentId', authMiddleware, deleteAttachment);

export default router; 