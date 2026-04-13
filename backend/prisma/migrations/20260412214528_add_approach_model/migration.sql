-- CreateTable
CREATE TABLE "Approach" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "birthDate" TIMESTAMP(3),
    "motherName" TEXT,
    "notes" TEXT,
    "isConvicted" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Approach_pkey" PRIMARY KEY ("id")
);
