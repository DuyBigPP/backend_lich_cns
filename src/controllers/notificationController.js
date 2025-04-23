import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tạo thông báo hệ thống khi sinh viên vắng mặt
export const createAbsenceNotification = async (studentId, attendanceId, subject, date) => {
  try {
    console.log(`Starting createAbsenceNotification with params:`, {
      studentId, attendanceId, subject, date
    });
    
    // Kiểm tra các tham số đầu vào
    if (!studentId) {
      console.error('Missing studentId parameter');
      throw new Error('Missing studentId parameter');
    }
    
    if (!attendanceId) {
      console.error('Missing attendanceId parameter');
      throw new Error('Missing attendanceId parameter');
    }
    
    if (!subject) {
      console.error('Missing subject parameter');
      throw new Error('Missing subject parameter');
    }
    
    if (!date) {
      console.error('Missing date parameter');
      throw new Error('Missing date parameter');
    }
    
    // Kiểm tra sinh viên tồn tại
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    
    if (!student) {
      console.error(`Student with ID ${studentId} not found`);
      throw new Error(`Student with ID ${studentId} not found`);
    }
    
    // Kiểm tra attendance tồn tại
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });
    
    if (!attendance) {
      console.error(`Attendance record with ID ${attendanceId} not found`);
      throw new Error(`Attendance record with ID ${attendanceId} not found`);
    }
    
    console.log(`Validated parameters: student=${student.name}, attendance=${attendance.subject}`);
    
    // Cố gắng kiểm tra xem thông báo đã tồn tại chưa
    const existingNotification = await prisma.systemNotification.findFirst({
      where: {
        studentId: studentId,
        attendanceId: attendanceId
      }
    });
    
    if (existingNotification) {
      console.log(`Notification already exists with ID: ${existingNotification.id}`);
      return existingNotification;
    }
    
    // Tạo nội dung thông báo với thông tin chi tiết
    const formattedDate = new Date(date).toLocaleDateString('vi-VN');
    const title = `Thông báo vắng học: ${subject}`;
    const content = `Bạn đã được ghi nhận vắng mặt trong buổi học ${subject} vào ngày ${formattedDate}. Nếu có nhầm lẫn, hãy phản hồi bằng cách cung cấp minh chứng.`;
    
    console.log(`Creating notification with title: "${title}"`);
    
    // Tạo thông báo mới
    try {
      const createData = {
        title: title,
        content: content,
        isRead: false,
        studentId: studentId,
        attendanceId: attendanceId
      };
      
      console.log("Notification create data:", createData);
      
      const notification = await prisma.systemNotification.create({
        data: createData
      });
      
      console.log(`Successfully created notification with ID: ${notification.id}`);
      return notification;
    } catch (createError) {
      console.error("Error during SystemNotification creation:", createError);
      
      // Kiểm tra lỗi chi tiết
      if (createError.code === 'P2003') {
        console.error("Foreign key constraint failed. Check that studentId and attendanceId exist in their respective tables.");
      } else if (createError.code === 'P2002') {
        console.error("Unique constraint failed. A notification with these keys may already exist.");
      }
      
      throw createError;
    }
  } catch (error) {
    console.error('Lỗi khi tạo thông báo vắng học:', error);
    // Log chi tiết hơn về lỗi
    if (error.code) {
      console.error(`Database error code: ${error.code}`);
    }
    if (error.meta) {
      console.error('Error metadata:', error.meta);
    }
    throw error;
  }
};

// Lấy tất cả thông báo của sinh viên
export const getStudentNotifications = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log(`Fetching notifications for student ID: ${studentId}`);
    
    // Tìm sinh viên trong database
    const student = await prisma.student.findUnique({
      where: { studentId: studentId }
    });
    
    if (!student) {
      console.log(`Student with ID ${studentId} not found`);
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    
    console.log(`Found student with internal ID: ${student.id}, fetching notifications`);
    
    // Lấy danh sách thông báo
    const notifications = await prisma.systemNotification.findMany({
      where: { studentId: student.id },
      include: {
        attendance: {
          select: {
            subject: true,
            lectureDate: true,
            hasResponse: true,
            responseStatus: true
          }
        },
        response: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${notifications.length} notifications for student ${student.id}`);
    
    res.json(notifications);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thông báo:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách thông báo' });
  }
};

// Đánh dấu thông báo đã đọc
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    // Cập nhật trạng thái đã đọc
    const notification = await prisma.systemNotification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
    
    res.json(notification);
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái thông báo:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái thông báo' });
  }
};

// Lấy chi tiết một thông báo
export const getNotificationDetail = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    // Lấy chi tiết thông báo
    const notification = await prisma.systemNotification.findUnique({
      where: { id: notificationId },
      include: {
        attendance: {
          select: {
            subject: true,
            lectureDate: true,
            hasResponse: true,
            responseStatus: true,
            note: true
          }
        },
        response: {
          include: {
            attachments: true
          }
        },
        student: {
          select: {
            name: true,
            studentId: true
          }
        }
      }
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Không tìm thấy thông báo' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết thông báo:', error);
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết thông báo' });
  }
};

// Lấy số lượng thông báo chưa đọc
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Tìm sinh viên trong database
    const student = await prisma.student.findUnique({
      where: { studentId: studentId }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    
    // Đếm số lượng thông báo chưa đọc
    const count = await prisma.systemNotification.count({
      where: {
        studentId: student.id,
        isRead: false
      }
    });
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Lỗi khi đếm thông báo chưa đọc:', error);
    res.status(500).json({ error: 'Lỗi khi đếm thông báo chưa đọc' });
  }
}; 