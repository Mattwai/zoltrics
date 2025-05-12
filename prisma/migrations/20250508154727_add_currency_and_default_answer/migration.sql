-- AlterTable
ALTER TABLE "FilterQuestions" ALTER COLUMN "answer" SET DEFAULT '';

-- AlterTable
ALTER TABLE "ServicePricing" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'NZD';
