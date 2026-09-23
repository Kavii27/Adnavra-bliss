-- Enable btree_gist for GiST index on TEXT columns (staffMemberId)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent double-booking: same staff member cannot have overlapping bookings.
-- Uses an EXCLUDE constraint with tstzrange so even concurrent transactions
-- race-conditioned at the millisecond level cannot both succeed — the database
-- rejects the second insert with a constraint violation (PG code 23P01).
-- WHERE clause: only enforce when staff is assigned and booking is not cancelled.
-- Cancelled bookings are allowed to overlap (they free the slot).
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap_per_staff"
  EXCLUDE USING gist (
    "staffMemberId" WITH =,
    tstzrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("staffMemberId" IS NOT NULL AND "status" != 'CANCELLED');
