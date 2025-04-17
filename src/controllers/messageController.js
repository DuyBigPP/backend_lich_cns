import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import multer from 'multer';

const prisma = new PrismaClient();
const unlinkAsync = promisify(fs.unlink);

// Cấu hình lưu trữ file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Giới hạn kích thước file: 10MB
});

// Gửi tin nhắn mới (từ sinh viên đến admin)
export const sendMessage = async (req, res) => {
  try {
    const { title, content, studentId, adminId } = req.body;
    
    // Kiểm tra sinh viên
    const student = await prisma.student.findUnique({
      where: { studentId }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    
    // Tạo tin nhắn mới
    const message = await prisma.message.create({
      data: {
        title,
        content,
        sender: { connect: { id: student.id } },
        receiver: { connect: { id: adminId } }
      }
    });
    
    // Xử lý tệp đính kèm nếu có
    if (req.files && req.files.length > 0) {
      const attachmentPromises = req.files.map(file => {
        return prisma.attachment.create({
          data: {
            fileName: file.originalname,
            fileType: file.mimetype,
            filePath: file.path,
            fileSize: file.size,
            message: { connect: { id: message.id } }
          }
        });
      });
      
      await Promise.all(attachmentPromises);
    }
    
    // Lấy thông tin đầy đủ của tin nhắn và tệp đính kèm
    const completeMessage = await prisma.message.findUnique({
      where: { id: message.id },
      include: { attachments: true }
    });
    
    res.status(201).json(completeMessage);
  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn:', error);
    res.status(500).json({ error: 'Lỗi khi gửi tin nhắn' });
  }
};

// Lấy tất cả tin nhắn của một sinh viên
export const getStudentMessages = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Tìm sinh viên
    const student = await prisma.student.findUnique({
      where: { studentId }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    
    // Lấy tất cả tin nhắn của sinh viên
    const messages = await prisma.message.findMany({
      where: { senderId: student.id },
      include: {
        attachments: true,
        receiver: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn của sinh viên:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tin nhắn của sinh viên' });
  }
};

// Lấy tất cả tin nhắn của một admin
export const getAdminMessages = async (req, res) => {
  try {
    const { adminId } = req.params;
    
    // Lấy tất cả tin nhắn của admin
    const messages = await prisma.message.findMany({
      where: { receiverId: adminId },
      include: {
        attachments: true,
        sender: {
          select: {
            id: true,
            name: true,
            studentId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn của admin:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tin nhắn của admin' });
  }
};

// Lấy số lượng tin nhắn chưa đọc của admin
export const getAdminUnreadMessageCount = async (req, res) => {
  try {
    const { adminId } = req.params;
    
    // Đếm tin nhắn chưa đọc của admin
    const count = await prisma.message.count({
      where: { 
        receiverId: adminId,
        isRead: false
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Lỗi khi lấy số lượng tin nhắn chưa đọc của admin:', error);
    res.status(500).json({ error: 'Lỗi khi lấy số lượng tin nhắn chưa đọc' });
  }
};

// Lấy chi tiết một tin nhắn
export const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        attachments: true,
        sender: {
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
    
    if (!message) {
      return res.status(404).json({ error: 'Không tìm thấy tin nhắn' });
    }
    
    res.json(message);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết tin nhắn:', error);
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết tin nhắn' });
  }
};

// Đánh dấu tin nhắn đã đọc
export const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await prisma.message.findUnique({
      where: { id }
    });
    
    if (!message) {
      return res.status(404).json({ error: 'Không tìm thấy tin nhắn' });
    }
    
    // Cập nhật trạng thái đã đọc
    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { isRead: true }
    });
    
    res.json(updatedMessage);
  } catch (error) {
    console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
    res.status(500).json({ error: 'Lỗi khi đánh dấu tin nhắn đã đọc' });
  }
};

// Xóa tin nhắn và tệp đính kèm liên quan
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Lấy thông tin tin nhắn và tệp đính kèm trước khi xóa
    const message = await prisma.message.findUnique({
      where: { id },
      include: { attachments: true }
    });
    
    if (!message) {
      return res.status(404).json({ error: 'Không tìm thấy tin nhắn' });
    }
    
    // Xóa các tệp đính kèm từ hệ thống file
    if (message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        try {
          await unlinkAsync(attachment.filePath);
        } catch (err) {
          console.error(`Không thể xóa file: ${attachment.filePath}`, err);
        }
      }
    }
    
    // Xóa tin nhắn từ database (sẽ tự động xóa các attachments nhờ vào onDelete: Cascade)
    await prisma.message.delete({
      where: { id }
    });
    
    res.json({ message: 'Đã xóa tin nhắn thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa tin nhắn:', error);
    res.status(500).json({ error: 'Lỗi khi xóa tin nhắn' });
  }
};

// Tải xuống tệp đính kèm
export const downloadAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attachment = await prisma.attachment.findUnique({
      where: { id }
    });
    
    if (!attachment) {
      return res.status(404).json({ error: 'Không tìm thấy tệp đính kèm' });
    }
    
    res.download(attachment.filePath, attachment.fileName);
  } catch (error) {
    console.error('Lỗi khi tải xuống tệp đính kèm:', error);
    res.status(500).json({ error: 'Lỗi khi tải xuống tệp đính kèm' });
  }
}; 