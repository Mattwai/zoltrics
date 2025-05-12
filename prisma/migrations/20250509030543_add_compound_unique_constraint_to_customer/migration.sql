/*
  Warnings:

  - A unique constraint covering the columns `[email,userId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_userId_key" ON "Customer"("email", "userId");
