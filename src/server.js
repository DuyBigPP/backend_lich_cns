import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import studentRoutes from './routes/studentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import positionRoutes from './routes/positionRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import path from 'path';

dotenv.config();
const app = express();

// Cấu hình CORS để cho phép tất cả các requests và hỗ trợ credentials
app.use(cors({
  origin: '*', // Cho phép tất cả các nguồn 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Cấu hình để phục vụ các tệp tĩnh từ thư mục uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/messages', messageRoutes);

// Route chào mừng
app.get('/', (req, res) => {
  res.json({ message: 'Chào mừng đến với API quản lý lịch học sinh viên!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
