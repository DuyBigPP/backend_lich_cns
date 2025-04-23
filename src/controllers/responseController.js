import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Tạo phản hồi từ sinh viên
export const createStudentResponse = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { title, content } = req.body;
    const files = req.files; // Các file được upload bởi multer middleware
    
    // Tìm thông báo trong database
    const notification = await prisma.systemNotification.findUnique({
      where: { id: notificationId },
      include: { 
        attendance: true,
        student: true
      }
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Không tìm thấy thông báo' });
    }
    
    // Kiểm tra xem đã có phản hồi chưa
    const existingResponse = await prisma.studentResponse.findUnique({
      where: { notificationId: notificationId }
    });
    
    if (existingResponse) {
      return res.status(400).json({ error: 'Bạn đã phản hồi thông báo này rồi' });
    }
    
    // Tạo phản hồi mới
    const response = await prisma.studentResponse.create({
      data: {
        title,
        content,
        isRead: false,
        studentId: notification.studentId,
        notificationId: notification.id
      }
    });
    
    // Lưu các tệp đính kèm
    if (files && files.length > 0) {
      const attachments = [];
      
      for (const file of files) {
        const attachment = await prisma.responseAttachment.create({
          data: {
            fileName: file.originalname,
            fileType: file.mimetype,
            filePath: file.path,
            fileSize: file.size,
            responseId: response.id
          }
        });
        
        attachments.push(attachment);
      }
    }
    
    // Cập nhật trạng thái attendance
    await prisma.attendance.update({
      where: { id: notification.attendanceId },
      data: {
        hasResponse: true,
        responseStatus: 'pending'
      }
    });
    
    res.status(201).json({
      message: 'Phản hồi đã được gửi thành công',
      response
    });
  } catch (error) {
    console.error('Lỗi khi tạo phản hồi:', error);
    res.status(500).json({ error: 'Lỗi khi tạo phản hồi' });
  }
};

// Lấy danh sách các phản hồi (cho admin)
export const getResponses = async (req, res) => {
  try {
    // Lấy danh sách phản hồi
    const responses = await prisma.studentResponse.findMany({
      include: {
        student: {
          select: {
            name: true,
            studentId: true
          }
        },
        notification: {
          select: {
            title: true,
            attendance: {
              select: {
                subject: true,
                lectureDate: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(responses);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phản hồi:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách phản hồi' });
  }
};

// Lấy chi tiết phản hồi
export const getResponseDetail = async (req, res) => {
  try {
    const { responseId } = req.params;
    
    // Lấy chi tiết phản hồi
    const response = await prisma.studentResponse.findUnique({
      where: { id: responseId },
      include: {
        student: {
          select: {
            name: true,
            studentId: true,
            email: true
          }
        },
        notification: {
          include: {
            attendance: true
          }
        },
        attachments: true
      }
    });
    
    if (!response) {
      return res.status(404).json({ error: 'Không tìm thấy phản hồi' });
    }
    
    // Đánh dấu đã đọc nếu là admin
    if (req.user && req.user.role === 'admin' && !response.isRead) {
      await prisma.studentResponse.update({
        where: { id: responseId },
        data: { isRead: true }
      });
    }
    
    res.json(response);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết phản hồi:', error);
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết phản hồi' });
  }
};

// Cập nhật trạng thái phản hồi (cho admin)
export const updateResponseStatus = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { status, adminNote } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }
    
    // Lấy thông tin phản hồi
    const response = await prisma.studentResponse.findUnique({
      where: { id: responseId },
      include: {
        notification: {
          include: {
            attendance: true
          }
        }
      }
    });
    
    if (!response) {
      return res.status(404).json({ error: 'Không tìm thấy phản hồi' });
    }
    
    // Cập nhật trạng thái phản hồi
    const updatedResponse = await prisma.studentResponse.update({
      where: { id: responseId },
      data: {
        status,
        adminNote
      }
    });
    
    // Cập nhật trạng thái attendance
    await prisma.attendance.update({
      where: { id: response.notification.attendanceId },
      data: {
        responseStatus: status,
        absent: status === 'approved' ? false : response.notification.attendance.absent
      }
    });
    
    res.json({
      message: 'Đã cập nhật trạng thái phản hồi',
      response: updatedResponse
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái phản hồi:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái phản hồi' });
  }
};

// Xóa tệp đính kèm
export const deleteAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    // Tìm tệp đính kèm
    const attachment = await prisma.responseAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        response: {
          include: {
            student: true
          }
        }
      }
    });
    
    if (!attachment) {
      return res.status(404).json({ error: 'Không tìm thấy tệp đính kèm' });
    }
    
    // Kiểm tra quyền xóa (chỉ admin hoặc sinh viên tạo phản hồi)
    if (req.user.role !== 'admin' && req.user.id !== attachment.response.student.id) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa tệp đính kèm này' });
    }
    
    // Xóa file từ hệ thống
    try {
      fs.unlinkSync(attachment.filePath);
    } catch (fsError) {
      console.error('Lỗi khi xóa tệp:', fsError);
      // Không dừng xử lý nếu không xóa được file vật lý
    }
    
    // Xóa bản ghi từ database
    await prisma.responseAttachment.delete({
      where: { id: attachmentId }
    });
    
    res.json({ message: 'Đã xóa tệp đính kèm' });
  } catch (error) {
    console.error('Lỗi khi xóa tệp đính kèm:', error);
    res.status(500).json({ error: 'Lỗi khi xóa tệp đính kèm' });
  }
}; 