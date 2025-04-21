-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "booking_calendar_settings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "availableDays" TEXT[],
    "timeSlots" JSONB NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_calendar_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "booking_calendar_settings_userId_key" ON "booking_calendar_settings"("userId");

-- AddForeignKey
ALTER TABLE "booking_calendar_settings" ADD CONSTRAINT "booking_calendar_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
