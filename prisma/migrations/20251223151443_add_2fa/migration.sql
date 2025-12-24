-- AlterTable
ALTER TABLE "users" ADD COLUMN     "twoFAEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFASecret" TEXT,
ADD COLUMN     "twoFAType" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3);
 