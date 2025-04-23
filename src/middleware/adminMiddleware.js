import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware để xác thực quyền admin
 * Yêu cầu authMiddleware chạy trước để lấy thông tin user
 */
export const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Bạn chưa đăng nhập' });
    }
    
    // Kiểm tra xem user có phải là admin hay không
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id }
    });
    
    if (!admin) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập' });
    }
    
    // Thêm thông tin admin vào request
    req.admin = admin;
    req.user.role = 'admin';
    
    next();
  } catch (error) {
    console.error('Lỗi kiểm tra quyền admin:', error);
    res.status(500).json({ error: 'Lỗi xác thực quyền admin' });
  }
}; 