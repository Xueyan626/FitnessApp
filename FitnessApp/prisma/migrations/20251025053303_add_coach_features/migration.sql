-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "CoachReport" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "studentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "studentData" JSONB NOT NULL,
    "gptAnalysis" TEXT,
    "riskAnalysis" TEXT,
    "recommendations" TEXT,
    "knowledgeLinks" JSONB,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachStudent" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachStudent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachReport_coachId_createdAt_idx" ON "CoachReport"("coachId", "createdAt");

-- CreateIndex
CREATE INDEX "CoachReport_status_idx" ON "CoachReport"("status");

-- CreateIndex
CREATE INDEX "CoachStudent_coachId_idx" ON "CoachStudent"("coachId");

-- CreateIndex
CREATE INDEX "CoachStudent_studentId_idx" ON "CoachStudent"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachStudent_coachId_studentId_key" ON "CoachStudent"("coachId", "studentId");

-- AddForeignKey
ALTER TABLE "CoachReport" ADD CONSTRAINT "CoachReport_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachReport" ADD CONSTRAINT "CoachReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachStudent" ADD CONSTRAINT "CoachStudent_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachStudent" ADD CONSTRAINT "CoachStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
