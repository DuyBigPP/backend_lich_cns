import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Hàm băm mật khẩu
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Script cập nhật mật khẩu cho tất cả sinh viên
 */
async function main() {
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