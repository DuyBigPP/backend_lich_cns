import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script để tạo tin nhắn mẫu từ sinh viên B23DCCC048 gửi tới admin
 */
async function main() {
  try {
    // 1. Lấy admin làm người nhận
    const admin = await prisma.admin.findFirst();
    if (!admin) {
      console.error('Không tìm thấy admin nào trong hệ thống');
      return;
    }
    console.log('Admin người nhận:', admin.username);
    console.log('Admin ID:', admin.id);
    console.log('Admin UUID:', admin.id);

    // 2. Tìm sinh viên có mã số B23DCCC048
    const student = await prisma.student.findUnique({
      where: { studentId: 'B23DCCC048' }
    });
    
    if (!student) {
      console.error('Không tìm thấy sinh viên với mã số B23DCCC048');
      return;
    }
    console.log('Sinh viên gửi:', student.name, '(', student.studentId, ')');
    console.log('Student ID:', student.id);

    // 3. Tạo một tin nhắn mẫu
    const message = await prisma.message.create({
      data: {
        title: 'Xin phép vắng buổi học ngày 15/11',
        content: 'Kính gửi thầy/cô,\n\nEm xin phép được vắng buổi học ngày 15/11/2023 vì lý do sức khỏe. Em đã đi khám và bác sĩ yêu cầu em nghỉ ngơi.\n\nEm xin phép được học bù vào thời gian thích hợp.\n\nXin cảm ơn thầy/cô đã xem xét.\n\nTrân trọng,\n' + student.name,
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

    console.log('Đã tạo tin nhắn:');
    console.log(message);

    // 4. Tạo thêm một tin nhắn khác
    const message2 = await prisma.message.create({
      data: {
        title: 'Yêu cầu xem lại điểm bài tập lớn',
        content: 'Kính gửi thầy/cô,\n\nEm xin phép được yêu cầu xem lại điểm bài tập lớn môn Lập trình Web. Em cảm thấy điểm hiện tại chưa phản ánh đúng nỗ lực em đã bỏ ra. Em đã hoàn thành đầy đủ các chức năng yêu cầu như ghi trong đề bài.\n\nEm xin được gặp thầy/cô để trao đổi thêm về vấn đề này.\n\nTrân trọng,\n' + student.name,
        sender: {
          connect: {
            id: student.id
          }
        },
        receiver: {
          connect: {
            id: admin.id
          }
        },
        isRead: false
      }
    });

    console.log('Đã tạo tin nhắn thứ 2:');
    console.log(message2);

    // 5. Tạo tin nhắn khẩn cấp (chưa đọc)
    const message3 = await prisma.message.create({
      data: {
        title: '[KHẨN] Đề nghị hoãn thi học phần',
        content: 'Kính gửi thầy/cô,\n\nDo tình hình sức khỏe đột ngột không tốt, em xin phép được hoãn thi học phần Cơ sở dữ liệu vào ngày 20/11/2023.\n\nEm đã gửi kèm giấy xác nhận của bệnh viện để thầy/cô xem xét. Rất mong được sự chấp thuận của thầy/cô.\n\nTrân trọng,\n' + student.name,
        sender: {
          connect: {
            id: student.id
          }
        },
        receiver: {
          connect: {
            id: admin.id
          }
        },
        isRead: false
      }
    });

    console.log('Đã tạo tin nhắn khẩn cấp:');
    console.log(message3);

    console.log('Đã gửi thành công các tin nhắn từ sinh viên', student.studentId, 'tới admin', admin.username);
    console.log('Hãy sử dụng ID admin này trong frontend:', admin.id);
  } catch (error) {
    console.error('Lỗi khi tạo tin nhắn:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 