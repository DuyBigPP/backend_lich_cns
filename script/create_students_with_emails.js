const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Danh sách sinh viên cần tạo
    const students = [
      {
        name: 'Nguyễn Trường Giang',
        studentId: 'B23DCCC055',
        email: 'ntgiang141105@gmail.com',
        position: 'Data & AI'
      },
      {
        name: 'Nguyễn Viết Sang',
        studentId: 'B23DCCC142',
        email: 'sang9c123@gmail.com',
        position: 'Data & AI'
      },
      {
        name: 'Nguyễn Minh Quang',
        studentId: 'B23DCCC140',
        email: null,
        position: 'Data & AI'
      },
      {
        name: 'Nguyễn Chí Minh Hiếu',
        studentId: 'B23DCCC064',
        email: 'ncminhhieu127@gmail.com',
        position: 'Data & AI'
      },
      {
        name: 'Nguyễn Minh Đức',
        studentId: 'B23DCCC042',
        email: null,
        position: 'Data & AI'
      },
      {
        name: 'Nguyễn Đình Đạt',
        studentId: 'B23DCCC032',
        email: 'dinhdat201fb@gmail.com',
        position: 'Data & AI'
      },
      {
        name: 'Trần Đức Định',
        studentId: 'B23DCCC038',
        email: 'dinhtran29092005@gmail.com',
        position: 'Data & AI'
      },
      {
        name: 'Trần Đăng Sang',
        studentId: 'B23DCCC144',
        email: null,
        position: 'Data & AI'
      },
      {
        name: 'Hoàng Nguyễn Trà My',
        studentId: 'B23DCCC116',
        email: 'Hntramyy@gmail.com',
        position: 'Data & AI'
      },
      {
        name: 'Nguyễn Thị Hạnh Nguyên',
        studentId: 'B23DCCC124',
        email: 'nguyenthihanhnguyen525@gmail.com',
        position: 'Frontend'
      },
      {
        name: 'Nguyễn Hữu Nam',
        studentId: 'B23DCCC121',
        email: 'namn44241@gmail.com',
        position: 'Frontend'
      },
      {
        name: 'Nguyễn Thị Quỳnh Trang',
        studentId: 'B23DCCC160',
        email: 'tranglou1003@gmail.com',
        position: 'Frontend'
      },
      {
        name: 'Nguyễn Trường Giang',
        studentId: 'B23DCCC054',
        email: null,
        position: 'Backend'
      },
      {
        name: 'Lưu Đức Tuấn',
        studentId: 'B23DCCC170',
        email: null,
        position: 'Backend'
      }
    ];

    // Lấy các vị trí từ database
    const positions = await prisma.position.findMany();
    const positionMap = {};
    
    // Tạo map từ tên vị trí đến ID
    positions.forEach(pos => {
      positionMap[pos.name] = pos.id;
    });

    console.log('Vị trí có sẵn:', Object.keys(positionMap));

    // Nếu không có vị trí nào, thêm các vị trí mặc định
    if (Object.keys(positionMap).length === 0) {
      console.log('Không tìm thấy vị trí nào, đang tạo các vị trí mặc định...');
      
      const defaultPositions = [
        'Data & AI',
        'Odoo',
        'Frontend',
        'Backend',
        'BA & Test',
        'ATTT'
      ];
      
      for (const posName of defaultPositions) {
        const position = await prisma.position.create({
          data: { name: posName }
        });
        console.log(`Đã tạo vị trí: ${position.name} (${position.id})`);
        positionMap[position.name] = position.id;
      }
    }

    for (const studentData of students) {
      // Kiểm tra sinh viên đã tồn tại
      const existingStudent = await prisma.student.findUnique({
        where: {
          studentId: studentData.studentId
        }
      });

      if (existingStudent) {
        console.log(`Sinh viên với mã ${studentData.studentId} đã tồn tại, đang cập nhật...`);
        
        // Cập nhật thông tin sinh viên
        await prisma.student.update({
          where: { id: existingStudent.id },
          data: {
            name: studentData.name,
            email: studentData.email,
            positionId: positionMap[studentData.position] || null
          }
        });
        
        console.log(`Đã cập nhật sinh viên: ${studentData.name} (${studentData.studentId})`);
        continue;
      }

      // Tạo sinh viên mới
      try {
        const student = await prisma.student.create({
          data: {
            name: studentData.name,
            studentId: studentData.studentId,
            email: studentData.email,
            positionId: positionMap[studentData.position] || null
          }
        });

        console.log(`Đã tạo sinh viên: ${student.name} (${student.studentId})`);
      } catch (error) {
        console.error(`Lỗi khi tạo sinh viên ${studentData.studentId}:`, error);
      }
    }

    console.log('Hoàn thành thêm sinh viên!');
  } catch (error) {
    console.error('Lỗi khi thêm sinh viên:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 