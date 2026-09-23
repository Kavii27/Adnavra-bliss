-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('PHYSICAL', 'MOBILE', 'VIRTUAL');

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "city" TEXT,
ADD COLUMN     "county" TEXT,
ADD COLUMN     "directions" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationType" "LocationType",
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "teamSize" TEXT,
ADD COLUMN     "website" TEXT;
