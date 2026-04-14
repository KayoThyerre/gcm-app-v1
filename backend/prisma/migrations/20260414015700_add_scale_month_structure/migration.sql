-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('DAY', 'NIGHT');

-- CreateEnum
CREATE TYPE "ScaleRole" AS ENUM ('SUPERVISOR', 'RADIO_OPERATOR', 'PATROL');

-- CreateTable
CREATE TABLE "ScaleMonth" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScaleMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScaleDay" (
    "id" TEXT NOT NULL,
    "scaleMonthId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ScaleDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScaleAssignment" (
    "id" TEXT NOT NULL,
    "scaleDayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleInShift" "ScaleRole" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "ScaleAssignment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScaleDay" ADD CONSTRAINT "ScaleDay_scaleMonthId_fkey" FOREIGN KEY ("scaleMonthId") REFERENCES "ScaleMonth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScaleAssignment" ADD CONSTRAINT "ScaleAssignment_scaleDayId_fkey" FOREIGN KEY ("scaleDayId") REFERENCES "ScaleDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
