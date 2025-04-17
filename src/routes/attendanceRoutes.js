import express from 'express';
import { PrismaClient } from '@prisma/client';
import { checkAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Lấy tất cả bản ghi điểm danh
router.get('/', checkAuth, async (req, res) => {
  try {
    const attendances = await prisma.attendance.findMany({
      include: {
        student: true
      },
      orderBy: {
        lectureDate: 'desc'
      }
    });
    
    res.json(attendances);
  } catch (error) {
    console.error('Lỗi khi lấy tất cả bản ghi điểm danh:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tất cả bản ghi điểm danh' });
  }
});

// Lấy điểm danh theo sinh viên
router.get('/student/:studentId', checkAuth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Tìm sinh viên theo mã sinh viên
    const student = await prisma.student.findUnique({
      where: { studentId }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    
    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: {
        lectureDate: 'desc'
      }
    });
    
    res.json(attendances);
  } catch (error) {
    console.error('Lỗi khi lấy điểm danh theo sinh viên:', error);
    res.status(500).json({ error: 'Lỗi khi lấy điểm danh theo sinh viên' });
  }
});

// Tạo hoặc cập nhật điểm danh cho sinh viên
router.post('/student/:studentId', checkAuth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { lectureId, lectureDate, subject, absent, note } = req.body;
    
    if (!lectureId || !lectureDate || !subject) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    
    // Tìm sinh viên theo mã sinh viên
    const student = await prisma.student.findUnique({
      where: { studentId }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    
    // Tìm bản ghi điểm danh hiện có
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: student.id,
        lectureId
      }
    });
    
    if (existingAttendance) {
      // Cập nhật bản ghi hiện có
      const updatedAttendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          absent: absent ?? false,
          note,
          updatedAt: new Date()
        }
      });
      
      res.json(updatedAttendance);
    } else {
      // Tạo bản ghi mới
      const newAttendance = await prisma.attendance.create({
        data: {
          lectureId,
          lectureDate: new Date(lectureDate),
          subject,
          absent: absent ?? false,
          note,
          notified: false,
          studentId: student.id
        }
      });
      
      res.status(201).json(newAttendance);
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật điểm danh:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật điểm danh' });
  }
});

// Lấy thống kê điểm danh theo sinh viên
router.get('/stats/:studentId', checkAuth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Tìm sinh viên theo mã sinh viên
    const student = await prisma.student.findUnique({
      where: { studentId }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    
    // Lấy tất cả bản ghi điểm danh của sinh viên
    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id }
    });
    
    // Tổng hợp thống kê cơ bản
    const totalClasses = attendances.length;
    const absentCount = attendances.filter(a => a.absent).length;
    const attendanceRate = totalClasses > 0 ? ((totalClasses - absentCount) / totalClasses) * 100 : 0;
    
    // Tổng hợp theo môn học
    const subjectMap = new Map();
    
    attendances.forEach(attendance => {
      const subject = attendance.subject;
      
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, { total: 0, absent: 0 });
      }
      
      const stats = subjectMap.get(subject);
      stats.total += 1;
      
      if (attendance.absent) {
        stats.absent += 1;
      }
    });
    
    const subjectStats = Array.from(subjectMap.entries()).map(([subject, stats]) => ({
      subject,
      totalClasses: stats.total,
      absentCount: stats.absent,
      attendanceRate: stats.total > 0 ? ((stats.total - stats.absent) / stats.total) * 100 : 0
    }));
    
    res.json({
      totalClasses,
      absentCount,
      attendanceRate,
      subjectStats
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê điểm danh:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thống kê điểm danh' });
  }
});

// Lấy tổng hợp thống kê điểm danh cho tất cả sinh viên
router.get('/summary', checkAuth, async (req, res) => {
  try {
    // Lấy tất cả sinh viên với mảng (position)
    const students = await prisma.student.findMany({
      include: {
        position: true
      }
    });
    
    // Lấy tất cả bản ghi điểm danh
    const attendances = await prisma.attendance.findMany();
    
    // Tổng hợp thống kê cho từng sinh viên
    const summaryStats = await Promise.all(students.map(async (student) => {
      const studentAttendances = attendances.filter(a => a.studentId === student.id);
      const totalClasses = studentAttendances.length;
      const absentCount = studentAttendances.filter(a => a.absent).length;
      const rate = totalClasses > 0 ? ((totalClasses - absentCount) / totalClasses) * 100 : 0;
      
      return {
        studentId: student.studentId,
        name: student.name,
        totalClasses,
        absentCount,
        rate,
        position: student.position?.name
      };
    }));
    
    res.json(summaryStats);
  } catch (error) {
    console.error('Lỗi khi lấy tổng hợp thống kê điểm danh:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tổng hợp thống kê điểm danh' });
  }
});

// Lấy thống kê theo mảng
router.get('/position-stats', checkAuth, async (req, res) => {
  try {
    // Lấy tất cả mảng
    const positions = await prisma.position.findMany();
    
    // Lấy tất cả sinh viên với thông tin mảng
    const students = await prisma.student.findMany({
      include: {
        position: true
      }
    });
    
    // Lấy tất cả bản ghi điểm danh
    const attendances = await prisma.attendance.findMany();
    
    // Tổng hợp thống kê theo mảng
    const positionStats = positions.map(position => {
      // Lọc sinh viên thuộc mảng này
      const positionStudents = students.filter(s => s.positionId === position.id);
      
      // Lấy tất cả bản ghi điểm danh của sinh viên trong mảng
      let total = 0;
      let absent = 0;
      
      positionStudents.forEach(student => {
        const studentAttendances = attendances.filter(a => a.studentId === student.id);
        total += studentAttendances.length;
        absent += studentAttendances.filter(a => a.absent).length;
      });
      
      // Tính tỷ lệ điểm danh
      const present = total - absent;
      const attendanceRate = total > 0 ? (present / total) * 100 : 0;
      
      return {
        position: position.name,
        total,
        absent,
        present,
        attendanceRate
      };
    });
    
    // Thêm nhóm không có mảng
    const studentsWithoutPosition = students.filter(s => !s.positionId);
    if (studentsWithoutPosition.length > 0) {
      let total = 0;
      let absent = 0;
      
      studentsWithoutPosition.forEach(student => {
        const studentAttendances = attendances.filter(a => a.studentId === student.id);
        total += studentAttendances.length;
        absent += studentAttendances.filter(a => a.absent).length;
      });
      
      const present = total - absent;
      const attendanceRate = total > 0 ? (present / total) * 100 : 0;
      
      positionStats.push({
        position: "Chưa phân mảng",
        total,
        absent,
        present,
        attendanceRate
      });
    }
    
    res.json(positionStats);
  } catch (error) {
    console.error('Lỗi khi lấy thống kê theo mảng:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thống kê theo mảng' });
  }
});

// Lấy thống kê theo thời gian (theo tháng)
router.get('/time-stats', checkAuth, async (req, res) => {
  try {
    // Lấy tất cả bản ghi điểm danh
    const attendances = await prisma.attendance.findMany({
      orderBy: {
        lectureDate: 'asc'
      }
    });
    
    if (attendances.length === 0) {
      return res.json([]);
    }
    
    // Tạo map để nhóm theo tháng
    const monthMap = new Map();
    
    attendances.forEach(attendance => {
      const date = new Date(attendance.lectureDate);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthLabel = `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          key: monthKey,
          label: monthLabel,
          absent: 0,
          present: 0
        });
      }
      
      const stats = monthMap.get(monthKey);
      
      if (attendance.absent) {
        stats.absent += 1;
      } else {
        stats.present += 1;
      }
    });
    
    // Chuyển map thành mảng và sắp xếp theo thời gian
    const timeStats = Array.from(monthMap.values())
      .sort((a, b) => a.key.localeCompare(b.key));
    
    res.json(timeStats);
  } catch (error) {
    console.error('Lỗi khi lấy thống kê theo thời gian:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thống kê theo thời gian' });
  }
});

export default router;
