import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_hier_replace_in_production';

export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        position: true,
      },
    });
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách sinh viên' });
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        position: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }

    // Loại bỏ mật khẩu trước khi trả về
    const { password, ...studentWithoutPassword } = student;

    res.status(200).json(studentWithoutPassword);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin sinh viên' });
  }
};

export const getStudentByStudentId = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const student = await prisma.student.findUnique({
      where: { studentId },
      include: {
        position: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }

    // Loại bỏ mật khẩu trước khi trả về
    const { password, ...studentWithoutPassword } = student;

    res.status(200).json(studentWithoutPassword);
  } catch (error) {
    console.error('Error fetching student by studentId:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin sinh viên' });
  }
};

// Hàm tạo sinh viên mới (mật khẩu sẽ được xử lý bởi middleware)
export const createStudent = async (req: Request, res: Response) => {
  try {
    const { name, studentId, email, position } = req.body;

    if (!name || !studentId) {
      return res.status(400).json({ error: 'Tên và mã sinh viên là bắt buộc' });
    }

    // Kiểm tra xem sinh viên đã tồn tại chưa
    const existingStudent = await prisma.student.findUnique({
      where: { studentId },
    });

    if (existingStudent) {
      return res.status(400).json({ error: 'Sinh viên với mã này đã tồn tại' });
    }

    // Tạo sinh viên mới (mật khẩu đã được xử lý bởi middleware)
    const newStudent = await prisma.student.create({
      data: {
        name,
        studentId,
        email,
        positionId: position ? String(position) : undefined,
      },
      include: {
        position: true,
      },
    });

    // Loại bỏ mật khẩu trước khi trả về
    const { password, ...studentWithoutPassword } = newStudent;

    res.status(201).json(studentWithoutPassword);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Lỗi khi tạo sinh viên mới' });
  }
};

// Hàm xử lý đăng nhập cho sinh viên (xác thực đã được xử lý bởi middleware)
export const loginStudent = async (req: Request, res: Response) => {
  try {
    const { id, studentId, name } = req.user;

    // Tạo token JWT
    const token = jwt.sign(
      { id, studentId, role: 'student' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Lấy thông tin position của sinh viên
    const student = await prisma.student.findUnique({
      where: { id },
      include: { position: true },
    });

    // Trả về thông tin sinh viên và token
    res.status(200).json({
      token,
      id,
      name,
      studentId,
      email: student?.email,
      position: student?.position?.name || null,
    });
  } catch (error) {
    console.error('Error logging in student:', error);
    res.status(500).json({ error: 'Lỗi trong quá trình đăng nhập' });
  }
};

// Hàm cập nhật sinh viên (mật khẩu sẽ được xử lý bởi middleware)
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, studentId, email, position } = req.body;

    // Kiểm tra xem sinh viên có tồn tại
    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }

    // Cập nhật sinh viên (mật khẩu đã được xử lý bởi middleware)
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        name,
        studentId,
        email,
        positionId: position ? String(position) : null,
      },
      include: {
        position: true,
      },
    });

    // Loại bỏ mật khẩu trước khi trả về
    const { password, ...studentWithoutPassword } = updatedStudent;

    res.status(200).json(studentWithoutPassword);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật sinh viên' });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedStudent = await prisma.student.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Xóa sinh viên thành công' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Lỗi khi xóa sinh viên' });
  }
}; 