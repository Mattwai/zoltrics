/*
  Warnings:

  - A unique constraint covering the columns `[bookingLink]` on the table `UserBusinessProfile` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userId` on table `FilterQuestions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `KnowledgeBase` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "FilterQuestions" ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "answer" DROP NOT NULL;

-- AlterTable
ALTER TABLE "KnowledgeBase" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserBusinessProfile" ADD COLUMN     "bookingLink" TEXT;

-- CreateIndex
CREATE INDEX "FilterQuestions_userId_idx" ON "FilterQuestions"("userId");

-- CreateIndex
CREATE INDEX "KnowledgeBase_userId_idx" ON "KnowledgeBase"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBusinessProfile_bookingLink_key" ON "UserBusinessProfile"("bookingLink");
