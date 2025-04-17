import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware để tự động băm mật khẩu khi thêm mới hoặc cập nhật sinh viên
 */
export const hashStudentPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Chỉ xử lý khi có yêu cầu thêm/cập nhật sinh viên
    if (req.method !== 'POST' && req.method !== 'PUT') {
      return next();
    }

    // Nếu không có mật khẩu trong request, sử dụng mã sinh viên làm mật khẩu mặc định
    if (!req.body.password && req.body.studentId) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.studentId, salt);
    } else if (req.body.password) {
      // Nếu có mật khẩu trong request, băm mật khẩu
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    next();
  } catch (error) {
    console.error('Lỗi khi xử lý mật khẩu sinh viên:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};

/**
 * Middleware để kiểm tra xác thực sinh viên
 */
export const authenticateStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({ error: 'Mã sinh viên và mật khẩu là bắt buộc' });
    }

    const student = await prisma.student.findUnique({
      where: { studentId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }

    const isPasswordValid = await bcrypt.compare(password, student.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mật khẩu không đúng' });
    }

    // Nếu xác thực thành công, lưu thông tin sinh viên vào request
    req.user = {
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      role: 'student'
    };

    next();
  } catch (error) {
    console.error('Lỗi khi xác thực sinh viên:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
}; 