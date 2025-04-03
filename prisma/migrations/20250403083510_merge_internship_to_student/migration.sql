/*
  Warnings:

  - You are about to drop the `Internship` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Internship" DROP CONSTRAINT "Internship_studentId_fkey";

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "position" TEXT;

-- DropTable
DROP TABLE "Internship";
