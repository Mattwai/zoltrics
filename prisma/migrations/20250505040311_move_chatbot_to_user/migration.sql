/*
  Warnings:

  - You are about to drop the column `domainId` on the `ChatBot` table. All the data in the column will be lost.
  - You are about to drop the column `campaignId` on the `Domain` table. All the data in the column will be lost.
  - You are about to drop the column `domainId` on the `HelpDesk` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `ChatBot` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ChatBot" DROP CONSTRAINT "ChatBot_domainId_fkey";

-- DropForeignKey
ALTER TABLE "Domain" DROP CONSTRAINT "Domain_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "HelpDesk" DROP CONSTRAINT "HelpDesk_domainId_fkey";

-- DropIndex
DROP INDEX "ChatBot_domainId_key";

-- AlterTable
ALTER TABLE "ChatBot" DROP COLUMN "domainId",
ADD COLUMN     "userId" UUID;

-- AlterTable
ALTER TABLE "Domain" DROP COLUMN "campaignId";

-- AlterTable
ALTER TABLE "HelpDesk" DROP COLUMN "domainId",
ADD COLUMN     "userId" UUID;

-- CreateTable
CREATE TABLE "_CampaignToDomain" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CampaignToDomain_AB_unique" ON "_CampaignToDomain"("A", "B");

-- CreateIndex
CREATE INDEX "_CampaignToDomain_B_index" ON "_CampaignToDomain"("B");

-- CreateIndex
CREATE UNIQUE INDEX "ChatBot_userId_key" ON "ChatBot"("userId");

-- AddForeignKey
ALTER TABLE "ChatBot" ADD CONSTRAINT "ChatBot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpDesk" ADD CONSTRAINT "HelpDesk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignToDomain" ADD CONSTRAINT "_CampaignToDomain_A_fkey" FOREIGN KEY ("A") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignToDomain" ADD CONSTRAINT "_CampaignToDomain_B_fkey" FOREIGN KEY ("B") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
