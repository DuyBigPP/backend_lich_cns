import { PrismaClient } from '@prisma/client';
import { sendEmail, createScheduleNotificationEmail } from '../utils/email.js';

const prisma = new PrismaClient();

// Lấy lịch học của sinh viên qua mã sinh viên
export const getScheduleByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester } = req.query; // Học kỳ (nếu có)
    
    // Tìm sinh viên với mã sinh viên
    const student = await prisma.student.findUnique({
      where: { studentId }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    
    // TODO: Lấy lịch học từ API hoặc database
    // Đây là dữ liệu mẫu
    const scheduleData = [
      {
        id: '1',
        subject: 'Lập trình Web',
        time: '7:00 - 9:30, Thứ 2',
        room: '101-A1',
        teacher: 'Nguyễn Văn A'
      },
      {
        id: '2',
        subject: 'Cơ sở dữ liệu',
        time: '13:00 - 15:30, Thứ 3',
        room: '201-A2',
        teacher: 'Trần Thị B'
      }
    ];
    
    res.json({
      student,
      schedule: scheduleData
    });
  } catch (error) {
    console.error('Lỗi lấy lịch học:', error);
    res.status(500).json({ error: 'Lỗi lấy lịch học' });
  }
};

// Gửi thông báo lịch học qua email
export const sendScheduleNotification = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { scheduleId } = req.body;
    
    // Tìm sinh viên
    const student = await prisma.student.findUnique({
      where: { studentId }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    
    if (!student.email) {
      return res.status(400).json({ error: 'Sinh viên chưa có email' });
    }
    
    // TODO: Lấy thông tin lịch học cụ thể
    // Đây là dữ liệu mẫu
    const scheduleInfo = {
      subject: 'Lập trình Web',
      time: '7:00 - 9:30, Thứ 2, ngày 10/04/2023',
      room: '101-A1',
      teacher: 'Nguyễn Văn A'
    };
    
    // Tạo nội dung email
    const htmlContent = createScheduleNotificationEmail(student, scheduleInfo);
    
    // Gửi email
    await sendEmail(
      student.email,
      'Thông báo lịch học',
      `Thông báo lịch học môn ${scheduleInfo.subject}`,
      htmlContent
    );
    
    res.json({
      message: 'Đã gửi thông báo lịch học thành công',
      student: {
        id: student.id,
        name: student.name,
        email: student.email
      }
    });
  } catch (error) {
    console.error('Lỗi gửi thông báo lịch học:', error);
    res.status(500).json({ error: 'Lỗi gửi thông báo lịch học' });
  }
};