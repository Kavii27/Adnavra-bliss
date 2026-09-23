-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "category" TEXT;

-- CreateIndex
CREATE INDEX "customers_userId_idx" ON "customers"("userId");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
