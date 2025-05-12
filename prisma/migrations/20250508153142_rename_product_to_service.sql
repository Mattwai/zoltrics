-- First, create the new Service tables
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "domainId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServicePricing" (
    "id" UUID NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "serviceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePricing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceStatus" (
    "id" UUID NOT NULL,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "serviceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceStatus_pkey" PRIMARY KEY ("id")
);

-- Migrate data from Product to Service
INSERT INTO "Service" ("id", "name", "domainId", "userId", "createdAt", "updatedAt")
SELECT "id", "name", COALESCE("domainId", (SELECT "id" FROM "Domain" LIMIT 1)), COALESCE("userId", (SELECT "id" FROM "User" LIMIT 1)), "createdAt", "updatedAt"
FROM "Product";

-- Migrate data from ProductPricing to ServicePricing
INSERT INTO "ServicePricing" ("id", "price", "serviceId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), CAST("price" AS DOUBLE PRECISION), "productId", "createdAt", "updatedAt"
FROM "ProductPricing";

-- Migrate data from ProductStatus to ServiceStatus
INSERT INTO "ServiceStatus" ("id", "isLive", "serviceId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "isLive", "productId", "createdAt", "updatedAt"
FROM "ProductStatus";

-- Add new columns to Booking table
ALTER TABLE "Booking" ADD COLUMN "serviceId" UUID;
ALTER TABLE "Booking" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Booking" ADD COLUMN "startTime" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "endTime" TIMESTAMP(3);

-- Update existing bookings with calculated start and end times
UPDATE "Booking"
SET "serviceId" = "productId",
    "startTime" = COALESCE("date" + (CASE 
        WHEN "slot" ~ '^[0-9]+:[0-9]+$' 
        THEN INTERVAL '1 hour' * CAST(SPLIT_PART("slot", ':', 1) AS INTEGER)
        ELSE INTERVAL '0'
    END), CURRENT_TIMESTAMP),
    "endTime" = COALESCE("date" + (CASE 
        WHEN "slot" ~ '^[0-9]+:[0-9]+$' 
        THEN INTERVAL '1 hour' * (CAST(SPLIT_PART("slot", ':', 1) AS INTEGER) + 1)
        ELSE INTERVAL '1 hour'
    END), CURRENT_TIMESTAMP + INTERVAL '1 hour');

-- Make startTime and endTime NOT NULL after setting values
ALTER TABLE "Booking" ALTER COLUMN "startTime" SET NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "endTime" SET NOT NULL;

-- Update BookingPayment table
ALTER TABLE "BookingPayment" ADD COLUMN "amount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "BookingPayment" ADD COLUMN "currency" TEXT DEFAULT 'NZD';
ALTER TABLE "BookingPayment" ADD COLUMN "status" TEXT DEFAULT 'pending';

-- Make the new columns NOT NULL after setting default values
ALTER TABLE "BookingPayment" ALTER COLUMN "amount" SET NOT NULL;
ALTER TABLE "BookingPayment" ALTER COLUMN "currency" SET NOT NULL;
ALTER TABLE "BookingPayment" ALTER COLUMN "status" SET NOT NULL;

-- Update Customer table
ALTER TABLE "Customer" ADD COLUMN "name" TEXT DEFAULT 'Unknown Customer';

-- Update existing customers with NULL domainId and userId
UPDATE "Customer"
SET "domainId" = COALESCE("domainId", (SELECT "id" FROM "Domain" LIMIT 1)),
    "userId" = COALESCE("userId", (SELECT "id" FROM "User" LIMIT 1)),
    "name" = COALESCE("name", 'Unknown Customer');

-- Make the columns NOT NULL after setting values
ALTER TABLE "Customer" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "domainId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "userId" SET NOT NULL;

-- Drop old columns from Booking table
ALTER TABLE "Booking" DROP COLUMN "productId";
ALTER TABLE "Booking" DROP COLUMN "date";
ALTER TABLE "Booking" DROP COLUMN "slot";
ALTER TABLE "Booking" DROP COLUMN "email";
ALTER TABLE "Booking" DROP COLUMN "name";
ALTER TABLE "Booking" DROP COLUMN "notes";

-- Drop old columns from BookingMetadata table
ALTER TABLE "BookingMetadata" DROP COLUMN "source";
ALTER TABLE "BookingMetadata" DROP COLUMN "no_show";
ALTER TABLE "BookingMetadata" DROP COLUMN "riskScore";
ALTER TABLE "BookingMetadata" DROP COLUMN "googleUserId";
ALTER TABLE "BookingMetadata" DROP COLUMN "isAuthenticated";

-- Drop old columns from BookingPayment table
ALTER TABLE "BookingPayment" DROP COLUMN "depositRequired";
ALTER TABLE "BookingPayment" DROP COLUMN "depositPaid";

-- Drop old Product tables
DROP TABLE "ProductStatus";
DROP TABLE "ProductPricing";
DROP TABLE "Product";

-- Create indexes
CREATE INDEX "Service_domainId_idx" ON "Service"("domainId");
CREATE INDEX "Service_userId_idx" ON "Service"("userId");
CREATE UNIQUE INDEX "ServicePricing_serviceId_key" ON "ServicePricing"("serviceId");
CREATE INDEX "ServicePricing_serviceId_idx" ON "ServicePricing"("serviceId");
CREATE UNIQUE INDEX "ServiceStatus_serviceId_key" ON "ServiceStatus"("serviceId");
CREATE INDEX "ServiceStatus_serviceId_idx" ON "ServiceStatus"("serviceId");

-- Add foreign key constraints
ALTER TABLE "Service" ADD CONSTRAINT "Service_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Service" ADD CONSTRAINT "Service_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServicePricing" ADD CONSTRAINT "ServicePricing_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceStatus" ADD CONSTRAINT "ServiceStatus_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE; 