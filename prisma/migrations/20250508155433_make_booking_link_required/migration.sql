/*
  Warnings:

  - Made the column `bookingLink` on table `UserBusinessProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserBusinessProfile" ALTER COLUMN "bookingLink" SET NOT NULL,
ALTER COLUMN "bookingLink" SET DEFAULT gen_random_uuid();
