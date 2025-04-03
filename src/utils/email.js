import nodemailer from 'nodemailer';

// Cấu hình transporter
let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Gửi email đơn
 * @param {string} to - Địa chỉ email người nhận
 * @param {string} subject - Tiêu đề email
 * @param {string} text - Nội dung email dạng text
 * @param {string} html - Nội dung email dạng HTML
 * @returns {Promise} - Kết quả gửi email
 */
export const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html
  };
  
  return await transporter.sendMail(mailOptions);
};

/**
 * Mẫu email thông báo lịch học
 * @param {Object} student - Thông tin sinh viên
 * @param {Object} schedule - Thông tin lịch học
 * @returns {string} - HTML cho email
 */
export const createScheduleNotificationEmail = (student, schedule) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2c3e50; text-align: center;">Thông báo lịch học</h2>
      <p>Xin chào <strong>${student.name}</strong>,</p>
      <p>Chúng tôi xin thông báo về lịch học của bạn:</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #3498db; margin-top: 0;">${schedule.subject}</h3>
        <p><strong>Thời gian:</strong> ${schedule.time}</p>
        <p><strong>Phòng học:</strong> ${schedule.room}</p>
        <p><strong>Giảng viên:</strong> ${schedule.teacher}</p>
      </div>
      
      <p>Vui lòng đến đúng giờ và chuẩn bị đầy đủ tài liệu học tập.</p>
      
      <p style="margin-top: 30px;">Trân trọng,<br>Ban quản lý đào tạo</p>
    </div>
  `;
};

export default {
  sendEmail,
  createScheduleNotificationEmail
}; 