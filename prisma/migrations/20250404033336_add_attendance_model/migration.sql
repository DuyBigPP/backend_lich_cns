-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "lectureDate" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "absent" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
