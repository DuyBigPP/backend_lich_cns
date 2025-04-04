import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        position: true
      }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách sinh viên' });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { position: true }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy thông tin sinh viên' });
  }
};

export const getStudentByStudentId = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const student = await prisma.student.findUnique({
      where: { studentId: studentId },
      include: { position: true }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy thông tin sinh viên' });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { name, studentId, email, positionId } = req.body;
    
    // Kiểm tra xem mã sinh viên đã tồn tại chưa
    const existingStudent = await prisma.student.findUnique({
      where: { studentId }
    });
    
    if (existingStudent) {
      return res.status(400).json({ error: 'Mã sinh viên đã tồn tại' });
    }
    
    const studentData = {
      name,
      studentId,
      email
    };
    
    // Thêm positionId nếu được cung cấp
    if (positionId) {
      studentData.positionId = positionId;
    }
    
    const newStudent = await prisma.student.create({
      data: studentData,
      include: {
        position: true
      }
    });
    
    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Lỗi khi tạo sinh viên:', error);
    res.status(500).json({ error: 'Lỗi tạo sinh viên mới' });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { name, email, positionId } = req.body;
    
    const studentData = {
      name,
      email
    };
    
    // Cập nhật positionId nếu được cung cấp
    if (positionId !== undefined) {
      // Nếu positionId là null, xóa liên kết với position
      if (positionId === null) {
        studentData.position = { disconnect: true };
      } else {
        // Nếu không, kết nối với position mới
        studentData.position = { connect: { id: positionId } };
      }
    }
    
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: studentData,
      include: {
        position: true
      }
    });
    
    res.json(updatedStudent);
  } catch (error) {
    console.error('Lỗi khi cập nhật sinh viên:', error);
    res.status(500).json({ error: 'Lỗi cập nhật thông tin sinh viên' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    
    await prisma.student.delete({
      where: { id: studentId }
    });
    
    res.json({ message: 'Đã xóa sinh viên thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa sinh viên' });
  }
};
