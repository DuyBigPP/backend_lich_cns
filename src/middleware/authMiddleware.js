import jwt from 'jsonwebtoken';

export const checkAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Chưa đăng nhập' });
  
    // Xử lý cả với trường hợp có prefix "Bearer" và không có
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
  
    try {
      // Kiểm tra JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Lỗi xác thực token:', error);
      res.status(401).json({ error: 'Token không hợp lệ' });
    }
  };
  