const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { execSync } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Hàm băm mật khẩu
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Hàm kiểm tra và cập nhật cơ sở dữ liệu nếu cần
 */
async function updateDatabase() {
  console.log('Kiểm tra và cập nhật cơ sở dữ liệu...');
  
  try {
    // Chạy prisma migrate
    console.log('Chạy prisma migrate...');
    execSync('npx prisma migrate dev --name add_student_password', { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..') 
    });
    
    console.log('Cập nhật cơ sở dữ liệu thành công!');
  } catch (error) {
    console.error('Lỗi khi cập nhật cơ sở dữ liệu:', error);
    throw error;
  }
}

/**
 * Hàm cập nhật mật khẩu cho tất cả sinh viên
 */
async function updateAllStudentPasswords() {
  try {
    console.log('Bắt đầu cập nhật mật khẩu cho tất cả sinh viên...');
    
    // Lấy tất cả sinh viên
    const students = await prisma.student.findMany();
    
    console.log(`Tìm thấy ${students.length} sinh viên cần cập nhật mật khẩu.`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Cập nhật mật khẩu cho từng sinh viên
    for (const student of students) {
      try {
        // Mật khẩu mặc định là mã sinh viên
        const hashedPassword = await hashPassword(student.studentId);
        
        // Cập nhật mật khẩu cho sinh viên
        await prisma.student.update({
          where: { id: student.id },
          data: { password: hashedPassword }
        });
        
        console.log(`Đã cập nhật mật khẩu cho sinh viên: ${student.name} (${student.studentId})`);
        successCount++;
      } catch (error) {
        console.error(`Lỗi khi cập nhật mật khẩu cho sinh viên ${student.studentId}:`, error);
        failCount++;
      }
    }
    
    console.log(`Hoàn thành cập nhật mật khẩu: ${successCount} thành công, ${failCount} thất bại.`);
  } catch (error) {
    console.error('Lỗi khi cập nhật mật khẩu sinh viên:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('=== BẮT ĐẦU THIẾT LẬP TÀI KHOẢN SINH VIÊN ===');
    
    // Bước 1: Cập nhật cơ sở dữ liệu
    await updateDatabase();
    
    // Bước 2: Cập nhật mật khẩu cho tất cả sinh viên
    await updateAllStudentPasswords();
    
    console.log('=== HOÀN THÀNH THIẾT LẬP TÀI KHOẢN SINH VIÊN ===');
  } catch (error) {
    console.error('Lỗi khi thiết lập tài khoản sinh viên:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
main()
  .then(() => console.log('Script thực hiện thành công.'))
  .catch((e) => {
    console.error('Script thực hiện thất bại:', e);
    process.exit(1);
  }); 