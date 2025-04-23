-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "hasResponse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "responseStatus" TEXT;

-- CreateTable
CREATE TABLE "SystemNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,

    CONSTRAINT "SystemNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentResponse" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notificationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,

    CONSTRAINT "StudentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponseAttachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseId" TEXT NOT NULL,

    CONSTRAINT "ResponseAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentResponse_notificationId_key" ON "StudentResponse"("notificationId");

-- AddForeignKey
ALTER TABLE "SystemNotification" ADD CONSTRAINT "SystemNotification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemNotification" ADD CONSTRAINT "SystemNotification_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentResponse" ADD CONSTRAINT "StudentResponse_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "SystemNotification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentResponse" ADD CONSTRAINT "StudentResponse_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseAttachment" ADD CONSTRAINT "ResponseAttachment_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "StudentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
