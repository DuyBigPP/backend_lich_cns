import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Kiểm tra username đã tồn tại chưa
    const existingAdmin = await prisma.admin.findUnique({
      where: { username }
    });
    
    if (existingAdmin) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    
    // Mã hóa mật khẩu
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Tạo admin mới
    const newAdmin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword
      }
    });
    
    // Tạo JWT token
    const token = jwt.sign(
      { id: newAdmin.id, username: newAdmin.username },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );
    
    // Trả về thông tin không bao gồm mật khẩu
    const { password: _, ...adminWithoutPassword } = newAdmin;
    
    res.status(201).json({
      message: 'Đăng ký thành công',
      admin: adminWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ error: 'Lỗi đăng ký tài khoản' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Kiểm tra admin tồn tại
    const admin = await prisma.admin.findUnique({
      where: { username }
    });
    
    if (!admin) {
      return res.status(401).json({ error: 'Thông tin đăng nhập không chính xác' });
    }
    
    // So sánh mật khẩu
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Thông tin đăng nhập không chính xác' });
    }
    
    // Tạo JWT token
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );
    
    // Trả về thông tin không bao gồm mật khẩu
    const { password: _, ...adminWithoutPassword } = admin;
    
    res.json({
      message: 'Đăng nhập thành công',
      admin: adminWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ error: 'Lỗi đăng nhập' });
  }
};
