import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Danh sách sinh viên và mảng thực tập
  const students = [
    {
      studentId: 'B23DCCC048',
      position: 'Frontend'
    },
    {
      studentId: 'B23DCCC055',
      position: 'Frontend'
    },
    {
      studentId: 'B23DCCC142',
      position: 'Data & AI'
    },
    {
      studentId: 'B23DCCC140',
      position: 'Data & AI'
    },
    {
      studentId: 'B23DCCC064',
      position: 'Data & AI'
    },
    {
      studentId: 'B23DCCC042',
      position: 'Odoo'
    },
    {
      studentId: 'B23DCCC032',
      position: 'Data & AI'
    },
    {
      studentId: 'B23DCCC038',
      position: 'Data & AI'
    },
    {
      studentId: 'B23DCCC144',
      position: 'ATTT'
    },
    {
      studentId: 'B23DCCC116',
      position: 'BA & Test'
    },
    {
      studentId: 'B23DCCC124',
      position: 'BA & Test'
    },
    {
      studentId: 'B23DCCC121',
      position: 'Odoo'
    },
    {
      studentId: 'B23DCCC160',
      position: 'BA & Test'
    },
    {
      studentId: 'B23DCCC054',
      position: 'Frontend'
    },
    {
      studentId: 'B23DCCC170',
      position: 'Data & AI'
    }
  ];

  // Cập nhật position cho từng sinh viên
  for (const student of students) {
    try {
      await prisma.student.update({
        where: { studentId: student.studentId },
        data: { position: student.position },
      });
      console.log(`Đã cập nhật position cho sinh viên ${student.studentId}`);
    } catch (error) {
      console.error(`Lỗi khi cập nhật sinh viên ${student.studentId}:`, error);
    }
  }

  console.log('Hoàn thành cập nhật position cho các sinh viên.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect()); 