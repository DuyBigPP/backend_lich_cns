import express from 'express';
import nodemailer from 'nodemailer';
import { checkAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Cấu hình nodemailer
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Kiểm tra cấu hình email
router.get('/check-config', async (req, res) => {
  try {
    // Hiển thị thông tin cấu hình (ẩn mật khẩu)
    const config = {
      email: process.env.EMAIL_USER || 'Chưa cấu hình',
      passwordFirstChars: process.env.EMAIL_PASSWORD ? `${process.env.EMAIL_PASSWORD.slice(0, 4)}...` : 'Chưa cấu hình',
      configured: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASSWORD
    };
    
    res.json({
      status: 'success',
      config
    });
  } catch (error) {
    console.error('Lỗi kiểm tra cấu hình email:', error);
    res.status(500).json({ error: 'Lỗi kiểm tra cấu hình' });
  }
});

// Gửi email test
router.post('/test', checkAuth, async (req, res) => {
  try {
    const testEmail = req.body.email || process.env.EMAIL_USER;
    
    // Kiểm tra xem email đã được cấu hình chưa
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.status(400).json({ 
        error: 'Email chưa được cấu hình', 
        tip: 'Vui lòng cấu hình EMAIL_USER và EMAIL_PASSWORD trong file .env' 
      });
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: testEmail,
      subject: 'Kiểm tra gửi email từ hệ thống giám sát lịch CNS',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #3498db; text-align: center;">Kiểm tra hệ thống email</h2>
          <p>Xin chào,</p>
          <p>Đây là email kiểm tra từ hệ thống giám sát lịch CNS.</p>
          <p>Nếu bạn nhận được email này, tức là hệ thống đã được cấu hình đúng và có thể gửi email thành công.</p>
          <p style="margin-top: 20px;">Trân trọng,<br>Hệ thống giám sát lịch CNS</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    res.json({
      message: 'Gửi email test thành công',
      messageId: info.messageId,
      to: testEmail
    });
  } catch (error) {
    console.error('Lỗi gửi email test:', error);
    res.status(500).json({ 
      error: 'Lỗi gửi email test', 
      details: error.message,
      tip: 'Nếu sử dụng Gmail, bạn cần tạo App Password và cấu hình trong file .env'
    });
  }
});

// Gửi email cho sinh viên
router.post('/send', checkAuth, async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: 'Thiếu thông tin để gửi email' });
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    res.json({
      message: 'Gửi email thành công',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Lỗi gửi email:', error);
    res.status(500).json({ error: 'Lỗi gửi email' });
  }
});

// Gửi email thông báo cho nhóm sinh viên
router.post('/notify-group', checkAuth, async (req, res) => {
  try {
    const { emails, subject, text, html } = req.body;
    
    if (!emails || !emails.length || !subject || (!text && !html)) {
      return res.status(400).json({ error: 'Thiếu thông tin để gửi email' });
    }
    
    const results = [];
    
    for (const email of emails) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject,
          text,
          html
        };
        
        const info = await transporter.sendMail(mailOptions);
        results.push({ email, success: true, messageId: info.messageId });
      } catch (err) {
        results.push({ email, success: false, error: err.message });
      }
    }
    
    res.json({
      message: 'Đã gửi email cho nhóm',
      results
    });
  } catch (error) {
    console.error('Lỗi gửi email nhóm:', error);
    res.status(500).json({ error: 'Lỗi gửi email nhóm' });
  }
});

export default router;
