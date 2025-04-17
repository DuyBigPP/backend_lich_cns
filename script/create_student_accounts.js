const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  try {
    console.log('Bắt đầu tạo tài khoản cho sinh viên...');
    
    // Lấy tất cả sinh viên chưa có mật khẩu hoặc có mật khẩu mặc định
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { password: 'defaultpassword' },
          { password: null }
        ]
      }
    });
    
    console.log(`Tìm thấy ${students.length} sinh viên cần tạo tài khoản.`);
    
    // Tạo tài khoản cho từng sinh viên
    for (const student of students) {
      // Mật khẩu mặc định là mã sinh viên
      const hashedPassword = await hashPassword(student.studentId);
      
      // Cập nhật mật khẩu cho sinh viên
      await prisma.student.update({
        where: { id: student.id },
        data: { password: hashedPassword }
      });
      
      console.log(`Đã tạo tài khoản cho sinh viên: ${student.name} (${student.studentId})`);
    }
    
    console.log('Hoàn thành tạo tài khoản cho sinh viên!');
  } catch (error) {
    console.error('Lỗi khi tạo tài khoản sinh viên:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Script thực hiện thành công.'))
  .catch((e) => {
    console.error('Script thực hiện thất bại:', e);
    process.exit(1);
  }); 