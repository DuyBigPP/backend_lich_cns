import jwt from 'jsonwebtoken';

export const checkAuth = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });
  
    try {
      // Kiểm tra JWT token (giả sử bạn dùng JSON Web Token)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Token không hợp lệ' });
    }
  };
  