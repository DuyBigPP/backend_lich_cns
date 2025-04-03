# Backend API cho hệ thống quản lý lịch học sinh viên

Backend phục vụ cho ứng dụng theo dõi và quản lý lịch học sinh viên.

## Cài đặt

1. Clone repository
2. Đi đến thư mục backend:
```
cd backend
```
3. Cài đặt các thư viện:
```
npm install
```
4. Cấu hình biến môi trường:
   - Tạo file `.env` (hoặc sửa file hiện có)
   - Cấu hình database và các thông tin cần thiết

5. Khởi tạo cơ sở dữ liệu:
```
npx prisma migrate dev --name init
```

6. Khởi động server:
```
npm run dev
```

## API Endpoints

### Xác thực

- **POST** `/api/admins/register` - Đăng ký admin mới
- **POST** `/api/admins/login` - Đăng nhập admin
- **GET** `/api/auth/verify` - Kiểm tra token

### Sinh viên

- **GET** `/api/students` - Lấy danh sách tất cả sinh viên
- **GET** `/api/students/:id` - Lấy thông tin sinh viên theo ID
- **GET** `/api/students/studentId/:studentId` - Lấy thông tin sinh viên theo mã sinh viên
- **POST** `/api/students` - Tạo sinh viên mới (cần xác thực)
- **PUT** `/api/students/:id` - Cập nhật thông tin sinh viên (cần xác thực)
- **DELETE** `/api/students/:id` - Xóa sinh viên (cần xác thực)

### Lịch học

- **GET** `/api/schedule/student/:studentId` - Lấy lịch học của sinh viên
- **POST** `/api/schedule/notify/:studentId` - Gửi thông báo lịch học cho sinh viên (cần xác thực)

### Email

- **POST** `/api/email/send` - Gửi email cho sinh viên (cần xác thực)
- **POST** `/api/email/notify-group` - Gửi email thông báo cho nhóm sinh viên (cần xác thực)

## Cấu trúc thư mục

```
backend/
  ├── node_modules/
  ├── prisma/
  │   ├── migrations/
  │   └── schema.prisma
  ├── src/
  │   ├── controllers/
  │   │   ├── adminController.js
  │   │   ├── studentController.js
  │   │   └── scheduleController.js
  │   ├── middleware/
  │   │   └── authMiddleware.js
  │   ├── routes/
  │   │   ├── adminRoutes.js
  │   │   ├── authRoutes.js
  │   │   ├── emailRoutes.js
  │   │   ├── scheduleRoutes.js
  │   │   └── studentRoutes.js
  │   ├── utils/
  │   │   └── email.js
  │   └── server.js
  ├── .env
  ├── .gitignore
  ├── package.json
  └── README.md
```

## Môi trường

Cần cài đặt các biến môi trường sau trong file `.env`:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/schedule?schema=public"
JWT_SECRET="your_jwt_secret"
PORT=3000
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
```

## Phát triển

1. Khi thay đổi schema Prisma, cập nhật database:
```
npx prisma migrate dev --name your_migration_name
```

2. Cập nhật Prisma client:
```
npx prisma generate
``` 