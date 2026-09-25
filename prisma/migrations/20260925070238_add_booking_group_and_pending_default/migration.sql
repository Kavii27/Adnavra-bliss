-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "groupTotal" INTEGER;

-- CreateIndex
CREATE INDEX "bookings_groupId_idx" ON "bookings"("groupId");
