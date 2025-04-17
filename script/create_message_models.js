import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script để tạo dữ liệu mẫu cho Message và Attachment models
 */
async function main() {
  try {
    // 1. Lấy một admin làm người nhận
    const admin = await prisma.admin.findFirst();
    if (!admin) {
      console.error('Không tìm thấy admin nào trong hệ thống');
      return;
    }
    console.log('Admin người nhận:', admin.username);

    // 2. Lấy một sinh viên làm người gửi
    const student = await prisma.student.findFirst();
    if (!student) {
      console.error('Không tìm thấy sinh viên nào trong hệ thống');
      return;
    }
    console.log('Sinh viên người gửi:', student.name, '(', student.studentId, ')');

    // 3. Tạo một tin nhắn mẫu
    const message = await prisma.message.create({
      data: {
        title: 'Thư xin phép nghỉ học',
        content: 'Kính gửi thầy/cô,\n\nEm xin phép nghỉ buổi học ngày mai vì lý do sức khỏe. Em đã đi khám và bác sĩ yêu cầu em nghỉ ngơi. Em xin gửi kèm giấy khám bệnh.\n\nXin cảm ơn thầy/cô đã xem xét.\n\nTrân trọng,\n' + student.name,
        sender: {
          connect: {
            id: student.id
          }
        },
        receiver: {
          connect: {
            id: admin.id
          }
        }
      }
    });

    console.log('Đã tạo tin nhắn mẫu:');
    console.log(message);

    // 4. Tạo thêm một tin nhắn khác
    const message2 = await prisma.message.create({
      data: {
        title: 'Câu hỏi về bài tập',
        content: 'Kính gửi thầy/cô,\n\nEm có thắc mắc về bài tập được giao tuần trước. Em không hiểu yêu cầu ở phần 3. Thầy/cô có thể giải thích thêm được không ạ?\n\nTrân trọng,\n' + student.name,
        sender: {
          connect: {
            id: student.id
          }
        },
        receiver: {
          connect: {
            id: admin.id
          }
        }
      }
    });

    console.log('Đã tạo tin nhắn mẫu thứ 2:');
    console.log(message2);

    console.log('Đã tạo dữ liệu mẫu thành công!');
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu mẫu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 