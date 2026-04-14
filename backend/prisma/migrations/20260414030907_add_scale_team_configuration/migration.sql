-- CreateEnum
CREATE TYPE "InitialCycle" AS ENUM ('DAY', 'NIGHT_START', 'NIGHT_END', 'OFF');

-- CreateTable
CREATE TABLE "ScaleTeamConfig" (
    "id" TEXT NOT NULL,
    "scaleMonthId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "initialCycle" "InitialCycle" NOT NULL,
    "supervisorName" TEXT NOT NULL,
    "radioOperatorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScaleTeamConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScaleTeamMember" (
    "id" TEXT NOT NULL,
    "teamConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScaleTeamMember_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScaleTeamConfig" ADD CONSTRAINT "ScaleTeamConfig_scaleMonthId_fkey" FOREIGN KEY ("scaleMonthId") REFERENCES "ScaleMonth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScaleTeamMember" ADD CONSTRAINT "ScaleTeamMember_teamConfigId_fkey" FOREIGN KEY ("teamConfigId") REFERENCES "ScaleTeamConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
