import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Kiểm tra dữ liệu admin
    const admins = await prisma.admin.findMany();
    console.log('Admins:', JSON.stringify(admins, null, 2));
    
    // Kiểm tra tất cả tin nhắn
    const messages = await prisma.message.findMany({
      include: {
        sender: true,
        receiver: true
      }
    });
    console.log('Messages count:', messages.length);
    
    if (messages.length > 0) {
      console.log('First message:', JSON.stringify(messages[0], null, 2));
    }
    
    // Kiểm tra tin nhắn admin ID 1
    const adminId = "1";
    const adminMessages = await prisma.message.findMany({
      where: { receiverId: adminId },
      include: {
        attachments: true,
        sender: {
          select: {
            id: true,
            name: true,
            studentId: true
          }
        }
      }
    });
    
    console.log(`Admin ID ${adminId} messages count:`, adminMessages.length);
    
    if (adminMessages.length > 0) {
      console.log('First admin message:', JSON.stringify(adminMessages[0], null, 2));
    } else {
      console.log('Không có tin nhắn nào cho admin ID:', adminId);
      
      // Kiểm tra tất cả các receiverId trong bảng message
      const receiverIds = await prisma.message.findMany({
        select: {
          receiverId: true
        },
        distinct: ['receiverId']
      });
      
      console.log('Các receiverId hiện có:', JSON.stringify(receiverIds, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 