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
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
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

// Đánh dấu phản hồi đã đọc
router.patch('/:responseId/read', authMiddleware, async (req, res) => {
  try {
    const { responseId } = req.params;
    
    // Kiểm tra xem phản hồi có tồn tại không
    const existingResponse = await prisma.studentResponse.findUnique({
      where: { id: responseId }
    });
    
    if (!existingResponse) {
      return res.status(404).json({ error: 'Không tìm thấy phản hồi' });
    }
    
    // Cập nhật trạng thái đã đọc
    const updatedResponse = await prisma.studentResponse.update({
      where: { id: responseId },
      data: { isRead: true }
    });
    
    res.json({ 
      message: 'Đã đánh dấu phản hồi đã đọc',
      response: updatedResponse 
    });
  } catch (error) {
    console.error('Lỗi khi đánh dấu phản hồi đã đọc:', error);
    res.status(500).json({ error: 'Lỗi khi đánh dấu phản hồi đã đọc' });
  }
});

// Tải xuống tệp đính kèm theo ID
router.get('/attachment/:attachmentId/download', authMiddleware, async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    // Tìm tệp đính kèm trong cơ sở dữ liệu
    const attachment = await prisma.responseAttachment.findUnique({
      where: { id: attachmentId }
    });
    
    if (!attachment) {
      return res.status(404).json({ error: 'Không tìm thấy tệp đính kèm' });
    }
    
    // Lấy tên file từ đường dẫn
    const fileName = path.basename(attachment.filePath);
    // Đường dẫn đầy đủ của file
    const fullPath = path.join(process.cwd(), 'uploads/responses', fileName);
    
    // Kiểm tra xem file có tồn tại không
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Không tìm thấy file vật lý' });
    }
    
    // Thiết lập header cho việc tải xuống
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
    res.setHeader('Content-Type', attachment.fileType);
    
    // Gửi file về cho client
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Lỗi khi tải xuống tệp đính kèm:', error);
    res.status(500).json({ error: 'Lỗi khi tải xuống tệp đính kèm' });
  }
});

// Xóa tệp đính kèm
router.delete('/attachment/:attachmentId', authMiddleware, deleteAttachment);

export default router; 