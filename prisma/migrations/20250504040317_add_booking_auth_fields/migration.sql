-- AlterTable
ALTER TABLE "Bookings" ADD COLUMN     "googleUserId" UUID,
ADD COLUMN     "isAuthenticated" BOOLEAN NOT NULL DEFAULT false;
