-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "salonTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
