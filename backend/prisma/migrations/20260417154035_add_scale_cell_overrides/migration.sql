-- CreateEnum
CREATE TYPE "ScaleCellValue" AS ENUM ('DAY', 'NIGHT_START', 'NIGHT_END', 'NIGHT_FULL', 'OFF', 'MEDICAL_LEAVE', 'BANK_HOURS', 'VACATION');

-- CreateTable
CREATE TABLE "ScaleCellOverride" (
    "id" TEXT NOT NULL,
    "scaleMonthId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "value" "ScaleCellValue" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScaleCellOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScaleCellOverride_scaleMonthId_teamName_personName_day_key" ON "ScaleCellOverride"("scaleMonthId", "teamName", "personName", "day");

-- AddForeignKey
ALTER TABLE "ScaleCellOverride" ADD CONSTRAINT "ScaleCellOverride_scaleMonthId_fkey" FOREIGN KEY ("scaleMonthId") REFERENCES "ScaleMonth"("id") ON DELETE CASCADE ON UPDATE CASCADE;
