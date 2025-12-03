-- CreateEnum
CREATE TYPE "CoachStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coachStatus" "CoachStatus";
