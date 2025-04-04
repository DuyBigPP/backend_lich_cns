import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../utils/email.js';

const prisma = new PrismaClient();

// Lấy danh sách điểm danh của sinh viên
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Tìm sinh viên trong database
    const student = await prisma.student.findUnique({
      where: { studentId: studentId }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    
    // Lấy danh sách điểm danh
    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { lectureDate: 'desc' }
    });
    
    res.json(attendances);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách điểm danh:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách điểm danh' });
  }
};

// Tạo mới hoặc cập nhật điểm danh
export const createOrUpdateAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { lectureId, lectureDate, subject, absent, note } = req.body;
    
    // Tìm sinh viên trong database
    const student = await prisma.student.findUnique({
      where: { studentId: studentId }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    
    // Kiểm tra xem đã có bản ghi điểm danh chưa
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: student.id,
        lectureId: lectureId
      }
    });
    
    let attendance;
    
    if (existingAttendance) {
      // Cập nhật bản ghi hiện có
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          absent,
          note,
          notified: existingAttendance.absent !== absent ? false : existingAttendance.notified
        }
      });
    } else {
      // Tạo bản ghi mới
      attendance = await prisma.attendance.create({
        data: {
          lectureId,
          lectureDate: new Date(lectureDate),
          subject,
          absent,
          note,
          notified: false,
          studentId: student.id
        }
      });
    }
    
    // Gửi email nếu sinh viên vắng mặt và chưa được thông báo
    if (absent && !attendance.notified && student.email) {
      try {
        // Template email cảnh báo vắng học
        const emailSubject = 'Thông báo vắng học';
        const emailText = `Xin chào ${student.name},\n\nBạn đã vắng buổi học ${subject} vào ngày ${new Date(lectureDate).toLocaleDateString('vi-VN')}.\n\n${note ? 'Ghi chú: ' + note + '\n\n' : ''}Vui lòng liên hệ với giáo viên hoặc cố vấn học tập của bạn để biết thêm chi tiết.`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #d32f2f; text-align: center;">Thông báo vắng học</h2>
            <p>Xin chào <strong>${student.name}</strong>,</p>
            <p>Bạn đã <strong style="color: #d32f2f;">vắng mặt</strong> trong buổi học:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">${subject}</h3>
              <p><strong>Thời gian:</strong> ${new Date(lectureDate).toLocaleString('vi-VN')}</p>
              ${note ? `<p><strong>Ghi chú:</strong> ${note}</p>` : ''}
            </div>
            
            <p>Vui lòng liên hệ với giáo viên hoặc cố vấn học tập của bạn nếu có bất kỳ thắc mắc nào.</p>
            
            <p style="margin-top: 30px;">Trân trọng,<br>Ban quản lý đào tạo</p>
          </div>
        `;
        
        await sendEmail(student.email, emailSubject, emailText, emailHtml);
        
        // Cập nhật trạng thái đã gửi thông báo
        await prisma.attendance.update({
          where: { id: attendance.id },
          data: { notified: true }
        });
      } catch (emailError) {
        console.error('Lỗi khi gửi email thông báo:', emailError);
        // Không trả về lỗi, chỉ ghi log
      }
    }
    
    res.json(attendance);
  } catch (error) {
    console.error('Lỗi khi cập nhật điểm danh:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật điểm danh' });
  }
};

// Lấy thống kê điểm danh của sinh viên
export const getAttendanceStats = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Tìm sinh viên trong database
    const student = await prisma.student.findUnique({
      where: { studentId: studentId }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    
    // Lấy số buổi vắng mặt và tổng số buổi học
    const totalAttendances = await prisma.attendance.count({
      where: { studentId: student.id }
    });
    
    const absentCount = await prisma.attendance.count({
      where: {
        studentId: student.id,
        absent: true
      }
    });
    
    // Nhóm theo môn học
    const subjectStats = await prisma.attendance.groupBy({
      by: ['subject'],
      where: { studentId: student.id },
      _count: {
        subject: true
      },
      _sum: {
        absent: true
      }
    });
    
    res.json({
      totalClasses: totalAttendances,
      absentCount,
      attendanceRate: totalAttendances ? ((totalAttendances - absentCount) / totalAttendances) * 100 : 100,
      subjectStats: subjectStats.map(stat => ({
        subject: stat.subject,
        totalClasses: stat._count.subject,
        absentCount: stat._sum.absent || 0,
        attendanceRate: stat._count.subject ? ((stat._count.subject - (stat._sum.absent || 0)) / stat._count.subject) * 100 : 100
      }))
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê điểm danh:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thống kê điểm danh' });
  }
};
