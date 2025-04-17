/*
  Warnings:

  - You are about to drop the `RefreshToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentAccount` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_studentAccountId_fkey";

-- DropForeignKey
ALTER TABLE "StudentAccount" DROP CONSTRAINT "StudentAccount_studentId_fkey";

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "password" TEXT NOT NULL DEFAULT 'defaultpassword',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "RefreshToken";

-- DropTable
DROP TABLE "StudentAccount";
