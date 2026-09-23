/*
  Warnings:

  - The `plan` column on the `subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "LegacyPlanTier" AS ENUM ('STARTER', 'PROFESSIONAL', 'PREMIUM');

-- CreateEnum
CREATE TYPE "BoostSource" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "AdEventType" AS ENUM ('IMPRESSION', 'CLICK');

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "plan",
ADD COLUMN     "plan" "LegacyPlanTier" NOT NULL DEFAULT 'STARTER';

-- DropEnum
DROP TYPE "SubscriptionPlan";

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priceMonthly" INTEGER,
    "boostsPerWeek" INTEGER NOT NULL DEFAULT 0,
    "maxBoostHours" INTEGER NOT NULL DEFAULT 24,
    "galleryLimit" INTEGER,
    "serviceLimit" INTEGER,
    "searchWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isFeaturedEligible" BOOLEAN NOT NULL DEFAULT false,
    "isPriorityEligible" BOOLEAN NOT NULL DEFAULT false,
    "features" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_subscriptions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salon_boosts" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "source" "BoostSource" NOT NULL DEFAULT 'AUTO',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salon_boosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertisement_placements" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxActiveAds" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisement_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertisements" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertisement_events" (
    "id" TEXT NOT NULL,
    "advertisementId" TEXT NOT NULL,
    "type" "AdEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advertisement_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_key_key" ON "subscription_plans"("key");

-- CreateIndex
CREATE UNIQUE INDEX "business_subscriptions_businessId_key" ON "business_subscriptions"("businessId");

-- CreateIndex
CREATE INDEX "business_subscriptions_businessId_idx" ON "business_subscriptions"("businessId");

-- CreateIndex
CREATE INDEX "business_subscriptions_planId_idx" ON "business_subscriptions"("planId");

-- CreateIndex
CREATE INDEX "business_subscriptions_status_idx" ON "business_subscriptions"("status");

-- CreateIndex
CREATE INDEX "salon_boosts_businessId_idx" ON "salon_boosts"("businessId");

-- CreateIndex
CREATE INDEX "salon_boosts_startAt_endAt_idx" ON "salon_boosts"("startAt", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "advertisement_placements_key_key" ON "advertisement_placements"("key");

-- CreateIndex
CREATE INDEX "advertisements_placementId_idx" ON "advertisements"("placementId");

-- CreateIndex
CREATE INDEX "advertisements_startAt_endAt_idx" ON "advertisements"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "advertisements_isActive_idx" ON "advertisements"("isActive");

-- CreateIndex
CREATE INDEX "advertisement_events_advertisementId_type_idx" ON "advertisement_events"("advertisementId", "type");

-- CreateIndex
CREATE INDEX "advertisement_events_createdAt_idx" ON "advertisement_events"("createdAt");

-- AddForeignKey
ALTER TABLE "business_subscriptions" ADD CONSTRAINT "business_subscriptions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_subscriptions" ADD CONSTRAINT "business_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salon_boosts" ADD CONSTRAINT "salon_boosts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "advertisement_placements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisement_events" ADD CONSTRAINT "advertisement_events_advertisementId_fkey" FOREIGN KEY ("advertisementId") REFERENCES "advertisements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
