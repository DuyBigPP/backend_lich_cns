import express from 'express';
import { 
  sendMessage, 
  getStudentMessages, 
  getAdminMessages, 
  getMessageById, 
  markMessageAsRead, 
  deleteMessage, 
  downloadAttachment,
  upload,
  getAdminUnreadMessageCount
} from '../controllers/messageController.js';
// import { checkAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Bỏ middleware xác thực để tất cả các routes có thể truy cập được
// router.use(checkAuth);

// Tạo tin nhắn mới (với tệp đính kèm)
router.post('/', upload.array('attachments', 5), sendMessage);

// Lấy tất cả tin nhắn của một sinh viên
router.get('/student/:studentId', getStudentMessages);

// Lấy tất cả tin nhắn của một admin
router.get('/admin/:adminId', getAdminMessages);

// Lấy số lượng tin nhắn chưa đọc của admin
router.get('/admin/:adminId/unread/count', getAdminUnreadMessageCount);

// Lấy chi tiết một tin nhắn
router.get('/:id', getMessageById);

// Đánh dấu tin nhắn đã đọc
router.patch('/:id/read', markMessageAsRead);

// Xóa tin nhắn
router.delete('/:id', deleteMessage);

// Tải xuống tệp đính kèm
router.get('/attachment/:id/download', downloadAttachment);

export default router; 