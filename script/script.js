import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Danh sách email theo tên và mã sinh viên
  const studentEmails = [
    { studentId: 'B23DCCC055', email: 'ntgiang141105@gmail.com' },
    { studentId: 'B23DCCC142', email: 'sang9c123@gmail.com' },
    { studentId: 'B23DCCC038', email: 'dinhtran29092005@gmail.com' },
    { studentId: 'B23DCCC032', email: 'dinhdat201fb@gmail.com' },
    { studentId: 'B23DCCC064', email: 'ncminhhieu127@gmail.com' },
    { studentId: 'B23DCCC121', email: 'namn44241@gmail.com' },
    { studentId: 'B23DCCC124', email: 'nguyenthihanhnguyen525@gmail.com' },
    { studentId: 'B23DCCC160', email: 'tranglou1003@gmail.com' },
    { studentId: 'B23DCCC116', email: 'Hntramyy@gmail.com' },
    { studentId: 'B23DCCC048', email: 'nguyenluunhatduyhk9a@gmail.com' },
  ];

  // Cập nhật email cho từng sinh viên
  for (const student of studentEmails) {
    await prisma.student.update({
      where: { studentId: student.studentId },
      data: { email: student.email },
    });
  }

  console.log('Đã cập nhật email cho các sinh viên.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
