/*
  Warnings:

  - You are about to alter the column `bookingLink` on the `UserBusinessProfile` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "UserBusinessProfile" ALTER COLUMN "bookingLink" SET DATA TYPE VARCHAR(255);
