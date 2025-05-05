/*
  Warnings:

  - You are about to drop the column `domainId` on the `FilterQuestions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "FilterQuestions" DROP CONSTRAINT "FilterQuestions_domainId_fkey";

-- AlterTable
ALTER TABLE "FilterQuestions" DROP COLUMN "domainId",
ADD COLUMN     "userId" UUID;

-- AddForeignKey
ALTER TABLE "FilterQuestions" ADD CONSTRAINT "FilterQuestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
