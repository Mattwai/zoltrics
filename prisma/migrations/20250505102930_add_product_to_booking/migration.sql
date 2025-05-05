-- AlterTable
ALTER TABLE "Bookings" ADD COLUMN     "productId" UUID;

-- AddForeignKey
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
