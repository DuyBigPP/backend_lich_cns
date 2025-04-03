import express from 'express';
import nodemailer from 'nodemailer';
import { checkAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Cấu hình nodemailer
let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
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
