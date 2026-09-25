-- A multi-service appointment writes one Booking row per service, all sharing a
-- single customer-facing `reference` and linked by `groupId`. The UNIQUE index on
-- `reference` made the 2nd service row of any group fail with
-- "Unique constraint failed on the fields: (`reference`)", rolling the whole
-- transaction back and surfacing as HTTP 500 "Unable to create booking".
--
-- `reference` is only ever displayed (customer receipt, dashboard, notifications) and
-- is never used as a lookup key, so uniqueness is not needed. `groupId` (already
-- indexed) is the grouping key.

-- DropIndex
DROP INDEX IF EXISTS "bookings_reference_key";

-- CreateIndex
CREATE INDEX "bookings_reference_idx" ON "bookings"("reference");
