-- Prevent double-booking for unassigned (null staff) bookings at the database level.
-- Unassigned bookings compete for a single shared resource per business.
-- Complements the existing bookings_no_overlap_per_staff constraint which only covers staffMemberId IS NOT NULL.
-- WHERE clause mirrors the per-staff exclusion: ignore CANCELLED bookings.
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap_unassigned"
  EXCLUDE USING gist (
    "businessId" WITH =,
    tstzrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("staffMemberId" IS NULL AND "status" != 'CANCELLED');
