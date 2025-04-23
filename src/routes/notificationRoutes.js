import express from 'express';
import {
  getStudentNotifications,
  markNotificationAsRead,
  getNotificationDetail,
  getUnreadNotificationCount,
  createAbsenceNotification
} from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Đường dẫn: /api/notifications

// Route để kiểm tra tên bảng SystemNotification
router.get('/check-table-name', async (req, res) => {
  try {
    console.log("Checking system notification table name");
    
    // Lấy danh sách tất cả các bảng trong database
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    // Kiểm tra đặc biệt cho bảng SystemNotification
    const systemNotificationTable = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name ILIKE '%notification%';
    `;
    
    res.json({
      message: "Table check completed",
      allTables: tables,
      notificationTables: systemNotificationTable,
      prismaModelName: "systemNotification"
    });
  } catch (error) {
    console.error("Table check error:", error);
    res.status(500).json({
      error: "Failed to check table names",
      message: error.message
    });
  }
});

// Route để test truy cập bảng SystemNotification
router.get('/test-db', async (req, res) => {
  try {
    console.log("Testing database access to SystemNotification table");
    
    // Kiểm tra kết nối đến database
    const tableInfo = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'SystemNotification'
    `;
    
    // Thử đếm số bản ghi trong bảng
    const count = await prisma.systemNotification.count();
    
    // Thử lấy bản ghi đầu tiên (nếu có)
    const firstRecord = await prisma.systemNotification.findFirst();
    
    // Thử tạo một bản ghi test trực tiếp
    const testRecord = await prisma.systemNotification.create({
      data: {
        title: "Test Notification",
        content: "This is a test notification created directly",
        isRead: false,
        studentId: await getFirstStudentId(),
        attendanceId: await getFirstAttendanceId()
      }
    });
    
    res.json({
      message: "Database test completed",
      tableExists: tableInfo.length > 0,
      notificationCount: count,
      sampleRecord: firstRecord,
      testRecord: testRecord
    });
  } catch (error) {
    console.error("Database test error:", error);
    res.status(500).json({
      error: "Failed to test database",
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  }
});

// Route để kiểm tra học sinh và điểm danh
router.get('/check-students-attendance', async (req, res) => {
  try {
    // Lấy danh sách 5 sinh viên đầu tiên
    const students = await prisma.student.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        studentId: true
      }
    });
    
    // Lấy danh sách 5 bản ghi attendance đầu tiên
    const attendances = await prisma.attendance.findMany({
      take: 5,
      select: {
        id: true,
        subject: true,
        lectureDate: true,
        studentId: true,
        absent: true
      }
    });
    
    // Kiểm tra xem có bản ghi attendance nào có absent=true không
    const absentAttendances = await prisma.attendance.findMany({
      where: {
        absent: true
      },
      take: 5
    });
    
    res.json({
      students,
      attendances,
      absentAttendances,
      message: "Successfully retrieved students and attendances"
    });
  } catch (error) {
    console.error("Error checking students and attendances:", error);
    res.status(500).json({
      error: "Failed to check students and attendances",
      message: error.message
    });
  }
});

// Route để sửa chữa dữ liệu
router.post('/fix-data', async (req, res) => {
  try {
    // Tìm các attendance có absent=true nhưng chưa có notification
    const attendancesWithoutNotifications = await prisma.$queryRaw`
      SELECT a.id, a."studentId", a.subject, a."lectureDate"
      FROM "Attendance" a
      LEFT JOIN "SystemNotification" sn ON a.id = sn."attendanceId"
      WHERE a.absent = true AND sn.id IS NULL
      LIMIT 10;
    `;
    
    // Tạo notifications cho các attendance này
    const results = [];
    
    for (const attendance of attendancesWithoutNotifications) {
      try {
        const notification = await prisma.systemNotification.create({
          data: {
            title: `Thông báo vắng học: ${attendance.subject}`,
            content: `Bạn đã được ghi nhận vắng mặt trong buổi học ${attendance.subject} vào ngày ${new Date(attendance.lectureDate).toLocaleDateString('vi-VN')}. Nếu có nhầm lẫn, hãy phản hồi bằng cách cung cấp minh chứng.`,
            isRead: false,
            studentId: attendance.studentId,
            attendanceId: attendance.id
          }
        });
        
        // Cập nhật attendance này là đã thông báo
        await prisma.attendance.update({
          where: { id: attendance.id },
          data: { notified: true }
        });
        
        results.push({
          attendanceId: attendance.id,
          success: true,
          notification: notification.id
        });
      } catch (error) {
        results.push({
          attendanceId: attendance.id,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      message: "Data fix attempted",
      attendancesFound: attendancesWithoutNotifications.length,
      results
    });
  } catch (error) {
    console.error("Error fixing data:", error);
    res.status(500).json({
      error: "Failed to fix data",
      message: error.message
    });
  }
});

// Hàm helper để lấy ID của sinh viên đầu tiên
async function getFirstStudentId() {
  const student = await prisma.student.findFirst();
  if (!student) {
    throw new Error("No students found in database");
  }
  return student.id;
}

// Hàm helper để lấy ID của attendance đầu tiên
async function getFirstAttendanceId() {
  const attendance = await prisma.attendance.findFirst();
  if (!attendance) {
    throw new Error("No attendance records found in database");
  }
  return attendance.id;
}

// Route để test việc tạo thông báo
router.post('/test-create-notification', async (req, res) => {
  try {
    const { studentId, subject, date, note } = req.body;
    
    if (!studentId || !subject || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Tìm sinh viên
    const student = await prisma.student.findUnique({
      where: { studentId: studentId }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    console.log(`Creating test attendance for student ${student.id}`);
    
    // Tạo một bản ghi attendance mới
    const attendance = await prisma.attendance.create({
      data: {
        lectureId: `test-${Date.now()}`,
        lectureDate: new Date(date),
        subject: subject,
        absent: true,
        note: note || '',
        notified: false,
        hasResponse: false,
        responseStatus: null,
        studentId: student.id
      }
    });
    
    console.log(`Created test attendance with ID: ${attendance.id}`);
    
    // Tạo thông báo
    const notification = await createAbsenceNotification(
      student.id,
      attendance.id,
      subject,
      date
    );
    
    // Cập nhật attendance là đã thông báo
    await prisma.attendance.update({
      where: { id: attendance.id },
      data: { notified: true }
    });
    
    res.json({
      message: 'Notification created successfully',
      attendance,
      notification
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ 
      error: 'Failed to create notification',
      details: error.message
    });
  }
});

// Route để test trực tiếp tạo SystemNotification mà không qua createAbsenceNotification
router.post('/test-insert-direct', async (req, res) => {
  try {
    // Lấy sinh viên và attendance đầu tiên để dùng làm tham chiếu
    const student = await prisma.student.findFirst();
    const attendance = await prisma.attendance.findFirst();
    
    if (!student) {
      return res.status(404).json({ error: 'No students found in database' });
    }
    
    if (!attendance) {
      return res.status(404).json({ error: 'No attendance records found in database' });
    }
    
    console.log(`Attempting direct insert with studentId=${student.id}, attendanceId=${attendance.id}`);
    
    // Thử tạo thông báo trực tiếp bằng Prisma client
    const notification = await prisma.systemNotification.create({
      data: {
        title: "Test Direct Insert",
        content: "This notification was created directly through Prisma",
        isRead: false,
        studentId: student.id,
        attendanceId: attendance.id
      }
    });
    
    res.json({
      message: 'Direct insertion successful',
      notification
    });
  } catch (error) {
    console.error('Error during direct insert:', error);
    res.status(500).json({
      error: 'Failed to insert directly',
      details: error.message,
      code: error.code,
      meta: error.meta
    });
  }
});

// Lấy danh sách thông báo của sinh viên
router.get('/student/:studentId', authMiddleware, getStudentNotifications);

// Lấy số lượng thông báo chưa đọc
router.get('/student/:studentId/unread', authMiddleware, getUnreadNotificationCount);

// Đánh dấu thông báo đã đọc
router.patch('/:notificationId/read', authMiddleware, markNotificationAsRead);

// Lấy chi tiết một thông báo
router.get('/:notificationId', authMiddleware, getNotificationDetail);

// Route đơn giản để tạo thông báo mà không cần kiểm tra nhiều điều kiện
router.post('/simple-create', async (req, res) => {
  try {
    const { studentId, title, content, attendanceId } = req.body;
    
    // Lấy studentId và attendanceId mặc định nếu không được cung cấp
    let finalStudentId = studentId;
    let finalAttendanceId = attendanceId;
    
    if (!finalStudentId) {
      const student = await prisma.student.findFirst();
      if (!student) {
        return res.status(404).json({ error: 'Không tìm thấy sinh viên nào trong hệ thống' });
      }
      finalStudentId = student.id;
    }
    
    if (!finalAttendanceId) {
      const attendance = await prisma.attendance.findFirst();
      if (!attendance) {
        return res.status(404).json({ error: 'Không tìm thấy bản ghi điểm danh nào trong hệ thống' });
      }
      finalAttendanceId = attendance.id;
    }
    
    // Tạo thông báo mới
    const notification = await prisma.systemNotification.create({
      data: {
        title: title || 'Thông báo mới',
        content: content || 'Nội dung thông báo mới',
        isRead: false,
        studentId: finalStudentId,
        attendanceId: finalAttendanceId
      }
    });
    
    res.status(201).json({
      message: 'Đã tạo thông báo thành công',
      notification
    });
  } catch (error) {
    console.error('Lỗi khi tạo thông báo đơn giản:', error);
    res.status(500).json({
      error: 'Không thể tạo thông báo',
      details: error.message,
      code: error.code,
      meta: error.meta
    });
  }
});

export default router; 