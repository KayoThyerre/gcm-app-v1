-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastVerificationSentAt" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpires" TIMESTAMP(3),
ALTER COLUMN "role" SET DEFAULT 'USER',
ALTER COLUMN "status" SET DEFAULT 'PENDING';
