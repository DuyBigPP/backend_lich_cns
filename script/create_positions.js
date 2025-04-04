import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Danh sách các vị trí (mảng) cần tạo
    const positions = [
      'Data & AI',
      'Odoo',
      'Frontend',
      'Backend',
      'BA & Test',
      'ATTT'
    ];

    for (const positionName of positions) {
      // Kiểm tra xem vị trí đã tồn tại chưa
      const existingPosition = await prisma.position.findUnique({
        where: {
          name: positionName
        }
      });

      if (existingPosition) {
        console.log(`Vị trí "${positionName}" đã tồn tại`);
        continue;
      }

      // Tạo vị trí mới
      const position = await prisma.position.create({
        data: {
          name: positionName
        }
      });

      console.log(`Đã tạo vị trí: ${position.name}`);
    }

    console.log('Hoàn thành tạo các vị trí mảng!');
  } catch (error) {
    console.error('Lỗi khi tạo vị trí mảng:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 