/*
  Warnings:

  - You are about to drop the column `accessToken` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `accessTokenExpires` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `providerType` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `credits` on the `Billings` table. All the data in the column will be lost.
  - The `plan` column on the `Billings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `BlockedDate` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `date` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `domainId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `slot` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `googleUserId` on the `BookingMetadata` table. All the data in the column will be lost.
  - You are about to drop the column `isAuthenticated` on the `BookingMetadata` table. All the data in the column will be lost.
  - You are about to drop the column `no_show` on the `BookingMetadata` table. All the data in the column will be lost.
  - You are about to drop the column `riskScore` on the `BookingMetadata` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `BookingMetadata` table. All the data in the column will be lost.
  - You are about to drop the column `depositPaid` on the `BookingPayment` table. All the data in the column will be lost.
  - You are about to drop the column `depositRequired` on the `BookingPayment` table. All the data in the column will be lost.
  - You are about to drop the column `template` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `live` on the `ChatRoomStatus` table. All the data in the column will be lost.
  - You are about to drop the column `mailed` on the `ChatRoomStatus` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `CustomTimeSlot` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `CustomTimeSlot` table. All the data in the column will be lost.
  - You are about to drop the column `maxSlots` on the `CustomTimeSlot` table. All the data in the column will be lost.
  - You are about to drop the column `overrideRegular` on the `CustomTimeSlot` table. All the data in the column will be lost.
  - You are about to drop the column `answered` on the `CustomerResponses` table. All the data in the column will be lost.
  - You are about to drop the column `answered` on the `FilterQuestions` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `KnowledgeBase` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `KnowledgeBase` table. All the data in the column will be lost.
  - You are about to drop the column `accessToken` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `bookingLink` on the `UserBusinessProfile` table. All the data in the column will be lost.
  - You are about to drop the `DomainSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductPricing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `booking_calendar_settings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[provider,providerAccountId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `provider` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `BlockedDate` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `endTime` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `BookingPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `BookingPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `BookingPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Campaign` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `CampaignCustomer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ChatBot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ChatBot` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `ChatBot` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `content` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Made the column `chatRoomId` on table `ChatMessage` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `name` to the `ChatRoom` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `startTime` on the `CustomTimeSlot` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `endTime` on the `CustomTimeSlot` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `name` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domainId` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `answer` to the `CustomerResponses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CustomerResponses` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Domain` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `answer` to the `FilterQuestions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_productId_fkey";

-- DropForeignKey
ALTER TABLE "CustomTimeSlot" DROP CONSTRAINT "CustomTimeSlot_userId_fkey";

-- DropForeignKey
ALTER TABLE "DomainSettings" DROP CONSTRAINT "DomainSettings_domainId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_domainId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProductPricing" DROP CONSTRAINT "ProductPricing_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductStatus" DROP CONSTRAINT "ProductStatus_productId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "booking_calendar_settings" DROP CONSTRAINT "booking_calendar_settings_userId_fkey";

-- DropIndex
DROP INDEX "Account_providerId_providerAccountId_key";

-- DropIndex
DROP INDEX "BlockedDate_date_idx";

-- DropIndex
DROP INDEX "BlockedDate_userId_date_idx";

-- DropIndex
DROP INDEX "BlockedDate_userId_date_key";

-- DropIndex
DROP INDEX "Booking_date_idx";

-- DropIndex
DROP INDEX "Booking_domainId_idx";

-- DropIndex
DROP INDEX "Booking_email_idx";

-- DropIndex
DROP INDEX "Booking_productId_idx";

-- DropIndex
DROP INDEX "Campaign_createdAt_idx";

-- DropIndex
DROP INDEX "CampaignCustomer_campaignId_customerId_key";

-- DropIndex
DROP INDEX "ChatMessage_createdAt_idx";

-- DropIndex
DROP INDEX "ChatMessage_seen_idx";

-- DropIndex
DROP INDEX "ChatRoom_createdAt_idx";

-- DropIndex
DROP INDEX "CustomTimeSlot_createdAt_idx";

-- DropIndex
DROP INDEX "CustomTimeSlot_date_idx";

-- DropIndex
DROP INDEX "CustomTimeSlot_userId_date_idx";

-- DropIndex
DROP INDEX "Customer_createdAt_idx";

-- DropIndex
DROP INDEX "Customer_email_key";

-- DropIndex
DROP INDEX "Domain_name_idx";

-- DropIndex
DROP INDEX "FilterQuestions_userId_idx";

-- DropIndex
DROP INDEX "KnowledgeBase_category_idx";

-- DropIndex
DROP INDEX "KnowledgeBase_createdAt_idx";

-- DropIndex
DROP INDEX "KnowledgeBase_type_idx";

-- DropIndex
DROP INDEX "KnowledgeBase_userId_idx";

-- DropIndex
DROP INDEX "Session_accessToken_key";

-- DropIndex
DROP INDEX "User_createdAt_idx";

-- DropIndex
DROP INDEX "UserBusinessProfile_bookingLink_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "accessToken",
DROP COLUMN "accessTokenExpires",
DROP COLUMN "providerId",
DROP COLUMN "providerType",
DROP COLUMN "refreshToken",
ADD COLUMN     "access_token" TEXT,
ADD COLUMN     "expires_at" INTEGER,
ADD COLUMN     "id_token" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "refresh_token" TEXT,
ADD COLUMN     "scope" TEXT,
ADD COLUMN     "session_state" TEXT,
ADD COLUMN     "token_type" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Billings" DROP COLUMN "credits",
ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "plan",
ADD COLUMN     "plan" TEXT;

-- AlterTable
ALTER TABLE "BlockedDate" DROP CONSTRAINT "BlockedDate_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "date",
DROP COLUMN "domainId",
DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "notes",
DROP COLUMN "productId",
DROP COLUMN "slot",
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "serviceId" UUID,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BookingMetadata" DROP COLUMN "googleUserId",
DROP COLUMN "isAuthenticated",
DROP COLUMN "no_show",
DROP COLUMN "riskScore",
DROP COLUMN "source",
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BookingPayment" DROP COLUMN "depositPaid",
DROP COLUMN "depositRequired",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "template",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CampaignCustomer" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ChatBot" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "message",
DROP COLUMN "role",
ADD COLUMN     "content" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "chatRoomId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ChatRoom" ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ChatRoomStatus" DROP COLUMN "live",
DROP COLUMN "mailed",
ADD COLUMN     "isOpen" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CustomTimeSlot" DROP COLUMN "date",
DROP COLUMN "duration",
DROP COLUMN "maxSlots",
DROP COLUMN "overrideRegular",
DROP COLUMN "startTime",
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
DROP COLUMN "endTime",
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "domainId" SET NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CustomerResponses" DROP COLUMN "answered",
ADD COLUMN     "answer" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Domain" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "FilterQuestions" DROP COLUMN "answered",
ADD COLUMN     "answer" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "HelpDesk" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "KnowledgeBase" DROP COLUMN "category",
DROP COLUMN "type",
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "accessToken",
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT,
ADD COLUMN     "password" TEXT,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserBusinessProfile" DROP COLUMN "bookingLink",
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "bio" TEXT,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "theme" TEXT,
ALTER COLUMN "id" DROP DEFAULT;

-- DropTable
DROP TABLE "DomainSettings";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "ProductPricing";

-- DropTable
DROP TABLE "ProductStatus";

-- DropTable
DROP TABLE "booking_calendar_settings";

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "domainId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePricing" (
    "id" UUID NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "serviceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceStatus" (
    "id" UUID NOT NULL,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "serviceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingCalendarSettings" (
    "id" UUID NOT NULL,
    "userSettingsId" UUID NOT NULL,
    "timeZone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingCalendarSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Service_domainId_idx" ON "Service"("domainId");

-- CreateIndex
CREATE INDEX "Service_userId_idx" ON "Service"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePricing_serviceId_key" ON "ServicePricing"("serviceId");

-- CreateIndex
CREATE INDEX "ServicePricing_serviceId_idx" ON "ServicePricing"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceStatus_serviceId_key" ON "ServiceStatus"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceStatus_serviceId_idx" ON "ServiceStatus"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingCalendarSettings_userSettingsId_key" ON "BookingCalendarSettings"("userSettingsId");

-- CreateIndex
CREATE INDEX "BookingCalendarSettings_userSettingsId_idx" ON "BookingCalendarSettings"("userSettingsId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");

-- CreateIndex
CREATE INDEX "BookingMetadata_bookingId_idx" ON "BookingMetadata"("bookingId");

-- CreateIndex
CREATE INDEX "BookingPayment_bookingId_idx" ON "BookingPayment"("bookingId");

-- CreateIndex
CREATE INDEX "ChatBot_userId_idx" ON "ChatBot"("userId");

-- CreateIndex
CREATE INDEX "CustomTimeSlot_userId_idx" ON "CustomTimeSlot"("userId");

-- CreateIndex
CREATE INDEX "CustomerResponses_customerId_idx" ON "CustomerResponses"("customerId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "UserBusinessProfile_userId_idx" ON "UserBusinessProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_userId_idx" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePricing" ADD CONSTRAINT "ServicePricing_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceStatus" ADD CONSTRAINT "ServiceStatus_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingCalendarSettings" ADD CONSTRAINT "BookingCalendarSettings_userSettingsId_fkey" FOREIGN KEY ("userSettingsId") REFERENCES "UserSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomTimeSlot" ADD CONSTRAINT "CustomTimeSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
