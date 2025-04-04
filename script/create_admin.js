import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Kiểm tra xem đã có admin chưa
    const existingAdmin = await prisma.admin.findUnique({
      where: {
        username: 'admin',
      },
    });

    if (!existingAdmin) {
      // Hash mật khẩu
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin', salt);

      // Tạo admin mới
      const newAdmin = await prisma.admin.create({
        data: {
          username: 'admin',
          password: hashedPassword,
        },
      });

      console.log('Admin đã được tạo:', newAdmin);
    } else {
      console.log('Admin đã tồn tại:', existingAdmin);
    }
  } catch (error) {
    console.error('Lỗi khi tạo admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 