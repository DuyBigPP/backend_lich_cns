import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lấy tất cả các vị trí (mảng)
export const getAllPositions = async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    res.status(200).json(positions);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách vị trí:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy một vị trí theo ID
export const getPositionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const position = await prisma.position.findUnique({
      where: { id }
    });
    
    if (!position) {
      return res.status(404).json({ message: 'Không tìm thấy vị trí' });
    }
    
    res.status(200).json(position);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin vị trí:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Thêm vị trí mới
export const createPosition = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Tên vị trí là bắt buộc' });
    }
    
    // Kiểm tra vị trí đã tồn tại chưa
    const existingPosition = await prisma.position.findUnique({
      where: { name }
    });
    
    if (existingPosition) {
      return res.status(400).json({ message: 'Vị trí này đã tồn tại' });
    }
    
    const position = await prisma.position.create({
      data: { name }
    });
    
    res.status(201).json(position);
  } catch (error) {
    console.error('Lỗi khi tạo vị trí:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật vị trí
export const updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Tên vị trí là bắt buộc' });
    }
    
    // Kiểm tra vị trí đã tồn tại chưa
    const existingPosition = await prisma.position.findUnique({
      where: { name, NOT: { id } }
    });
    
    if (existingPosition) {
      return res.status(400).json({ message: 'Đã có vị trí khác với tên này' });
    }
    
    const position = await prisma.position.update({
      where: { id },
      data: { name }
    });
    
    res.status(200).json(position);
  } catch (error) {
    console.error('Lỗi khi cập nhật vị trí:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa vị trí
export const deletePosition = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem có sinh viên nào đang sử dụng vị trí này không
    const studentsUsingPosition = await prisma.student.count({
      where: { positionId: id }
    });
    
    if (studentsUsingPosition > 0) {
      return res.status(400).json({ 
        message: 'Không thể xóa vị trí này vì đang được sử dụng bởi sinh viên' 
      });
    }
    
    await prisma.position.delete({
      where: { id }
    });
    
    res.status(200).json({ message: 'Đã xóa vị trí thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa vị trí:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};