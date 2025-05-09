/*
  Warnings:

  - You are about to drop the column `bookingLink` on the `UserBusinessProfile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "UserBusinessProfile_bookingLink_idx";

-- DropIndex
DROP INDEX "UserBusinessProfile_bookingLink_key";

-- AlterTable
ALTER TABLE "UserBusinessProfile" DROP COLUMN "bookingLink";

-- CreateTable
CREATE TABLE "BookingLink" (
    "id" UUID NOT NULL,
    "link" VARCHAR(255) NOT NULL DEFAULT gen_random_uuid(),
    "userBusinessProfileId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingLink_link_key" ON "BookingLink"("link");

-- CreateIndex
CREATE UNIQUE INDEX "BookingLink_userBusinessProfileId_key" ON "BookingLink"("userBusinessProfileId");

-- CreateIndex
CREATE INDEX "BookingLink_link_idx" ON "BookingLink"("link");

-- CreateIndex
CREATE INDEX "BookingLink_userBusinessProfileId_idx" ON "BookingLink"("userBusinessProfileId");

-- AddForeignKey
ALTER TABLE "BookingLink" ADD CONSTRAINT "BookingLink_userBusinessProfileId_fkey" FOREIGN KEY ("userBusinessProfileId") REFERENCES "UserBusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
