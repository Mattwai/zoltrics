/*
  Warnings:

  - You are about to drop the column `customers` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `live` on the `ChatRoom` table. All the data in the column will be lost.
  - You are about to drop the column `mailed` on the `ChatRoom` table. All the data in the column will be lost.
  - The primary key for the `CustomTimeSlot` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `CustomTimeSlot` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `isLive` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `bookingLink` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `businessName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Bookings` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Domain` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `KnowledgeBase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "KnowledgeType" AS ENUM ('ARTICLE', 'FAQ', 'HELP');

-- DropForeignKey
ALTER TABLE "Bookings" DROP CONSTRAINT "Bookings_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Bookings" DROP CONSTRAINT "Bookings_productId_fkey";

-- DropForeignKey
ALTER TABLE "booking_calendar_settings" DROP CONSTRAINT "booking_calendar_settings_userId_fkey";

-- DropIndex
DROP INDEX "User_bookingLink_key";

-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "customers";

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "userId" UUID;

-- AlterTable
ALTER TABLE "ChatRoom" DROP COLUMN "live",
DROP COLUMN "mailed",
ADD COLUMN     "userId" UUID;

-- AlterTable
ALTER TABLE "CustomTimeSlot" DROP CONSTRAINT "CustomTimeSlot_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "CustomTimeSlot_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "userId" UUID;

-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "KnowledgeBase" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" "KnowledgeType" NOT NULL DEFAULT 'ARTICLE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "isLive",
DROP COLUMN "price",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" UUID;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bookingLink",
DROP COLUMN "businessName",
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- DropTable
DROP TABLE "Bookings";

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBusinessProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "businessName" TEXT,
    "bookingLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainSettings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "domainId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoomStatus" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chatRoomId" UUID NOT NULL,
    "live" BOOLEAN NOT NULL DEFAULT false,
    "mailed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatRoomStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" TIMESTAMP(3) NOT NULL,
    "slot" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "customerId" UUID,
    "domainId" UUID,
    "productId" UUID,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingMetadata" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL,
    "source" TEXT DEFAULT 'direct_link',
    "no_show" BOOLEAN NOT NULL DEFAULT false,
    "riskScore" DOUBLE PRECISION,
    "googleUserId" UUID,
    "isAuthenticated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPayment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignCustomer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaignId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPricing" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStatus" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "isLive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBusinessProfile_userId_key" ON "UserBusinessProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBusinessProfile_bookingLink_key" ON "UserBusinessProfile"("bookingLink");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DomainSettings_domainId_key" ON "DomainSettings"("domainId");

-- CreateIndex
CREATE INDEX "DomainSettings_domainId_idx" ON "DomainSettings"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoomStatus_chatRoomId_key" ON "ChatRoomStatus"("chatRoomId");

-- CreateIndex
CREATE INDEX "ChatRoomStatus_chatRoomId_idx" ON "ChatRoomStatus"("chatRoomId");

-- CreateIndex
CREATE INDEX "Booking_date_idx" ON "Booking"("date");

-- CreateIndex
CREATE INDEX "Booking_email_idx" ON "Booking"("email");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_domainId_idx" ON "Booking"("domainId");

-- CreateIndex
CREATE INDEX "Booking_productId_idx" ON "Booking"("productId");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingMetadata_bookingId_key" ON "BookingMetadata"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPayment_bookingId_key" ON "BookingPayment"("bookingId");

-- CreateIndex
CREATE INDEX "CampaignCustomer_campaignId_idx" ON "CampaignCustomer"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignCustomer_customerId_idx" ON "CampaignCustomer"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignCustomer_campaignId_customerId_key" ON "CampaignCustomer"("campaignId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPricing_productId_key" ON "ProductPricing"("productId");

-- CreateIndex
CREATE INDEX "ProductPricing_productId_idx" ON "ProductPricing"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductStatus_productId_key" ON "ProductStatus"("productId");

-- CreateIndex
CREATE INDEX "ProductStatus_productId_idx" ON "ProductStatus"("productId");

-- CreateIndex
CREATE INDEX "ProductStatus_isLive_idx" ON "ProductStatus"("isLive");

-- CreateIndex
CREATE INDEX "BlockedDate_userId_date_idx" ON "BlockedDate"("userId", "date");

-- CreateIndex
CREATE INDEX "Campaign_userId_idx" ON "Campaign"("userId");

-- CreateIndex
CREATE INDEX "Campaign_createdAt_idx" ON "Campaign"("createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_chatRoomId_idx" ON "ChatMessage"("chatRoomId");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_seen_idx" ON "ChatMessage"("seen");

-- CreateIndex
CREATE INDEX "ChatRoom_customerId_idx" ON "ChatRoom"("customerId");

-- CreateIndex
CREATE INDEX "ChatRoom_userId_idx" ON "ChatRoom"("userId");

-- CreateIndex
CREATE INDEX "ChatRoom_createdAt_idx" ON "ChatRoom"("createdAt");

-- CreateIndex
CREATE INDEX "CustomTimeSlot_date_idx" ON "CustomTimeSlot"("date");

-- CreateIndex
CREATE INDEX "CustomTimeSlot_createdAt_idx" ON "CustomTimeSlot"("createdAt");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_domainId_idx" ON "Customer"("domainId");

-- CreateIndex
CREATE INDEX "Customer_userId_idx" ON "Customer"("userId");

-- CreateIndex
CREATE INDEX "Customer_createdAt_idx" ON "Customer"("createdAt");

-- CreateIndex
CREATE INDEX "Domain_name_idx" ON "Domain"("name");

-- CreateIndex
CREATE INDEX "Domain_userId_idx" ON "Domain"("userId");

-- CreateIndex
CREATE INDEX "FilterQuestions_userId_idx" ON "FilterQuestions"("userId");

-- CreateIndex
CREATE INDEX "KnowledgeBase_userId_idx" ON "KnowledgeBase"("userId");

-- CreateIndex
CREATE INDEX "KnowledgeBase_type_idx" ON "KnowledgeBase"("type");

-- CreateIndex
CREATE INDEX "KnowledgeBase_category_idx" ON "KnowledgeBase"("category");

-- CreateIndex
CREATE INDEX "KnowledgeBase_createdAt_idx" ON "KnowledgeBase"("createdAt");

-- CreateIndex
CREATE INDEX "Product_userId_idx" ON "Product"("userId");

-- CreateIndex
CREATE INDEX "Product_domainId_idx" ON "Product"("domainId");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBusinessProfile" ADD CONSTRAINT "UserBusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainSettings" ADD CONSTRAINT "DomainSettings_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomStatus" ADD CONSTRAINT "ChatRoomStatus_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingMetadata" ADD CONSTRAINT "BookingMetadata_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPayment" ADD CONSTRAINT "BookingPayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCustomer" ADD CONSTRAINT "CampaignCustomer_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCustomer" ADD CONSTRAINT "CampaignCustomer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPricing" ADD CONSTRAINT "ProductPricing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStatus" ADD CONSTRAINT "ProductStatus_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_calendar_settings" ADD CONSTRAINT "booking_calendar_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
