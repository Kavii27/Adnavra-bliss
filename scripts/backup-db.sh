#!/usr/bin/env bash
# ADNAVRA — daily pg_dump cron job (Task 7.3)
# Usage: add to crontab: 0 2 * * * /path/to/scripts/backup-db.sh
# Requires DATABASE_URL in environment and pg_dump installed.

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not set" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

STAMP=$(date +%Y%m%d-%H%M%S)
FILE="$BACKUP_DIR/adnavra-$STAMP.sql.gz"

echo "Backing up to $FILE..."
pg_dump "$DATABASE_URL" | gzip > "$FILE"
echo "Backup complete: $FILE"

# ── Retention — keep 7 days locally ───────────────────────────────
find "$BACKUP_DIR" -name "adnavra-*.sql.gz" -mtime +7 -delete 2>/dev/null || true
echo "Local retention: kept last 7 days in $BACKUP_DIR"

# ── Off-server push (Section 6 / Task 7.3) ────────────────────────
# Configure ONE of these in production — backups must NOT live only on the VPS:
#   1. AWS CLI → S3 / Cloudflare R2 (S3-compatible)
#      export AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_ENDPOINT_URL_S3 (for R2)
#      export BACKUP_S3_BUCKET="s3://adnavra-backups"
#   2. rclone → any S3/Drive/SFTP remote
#      export BACKUP_RCLONE_REMOTE="r2:adnavra-backups"
#
# The script will try S3 first, then rclone, then warn if neither is configured.
if [ -n "${BACKUP_S3_BUCKET:-}" ] && command -v aws >/dev/null 2>&1; then
  echo "Uploading to $BACKUP_S3_BUCKET..."
  aws s3 cp "$FILE" "$BACKUP_S3_BUCKET/" --only-show-errors
  echo "Upload complete: $BACKUP_S3_BUCKET/$(basename "$FILE")"
elif [ -n "${BACKUP_RCLONE_REMOTE:-}" ] && command -v rclone >/dev/null 2>&1; then
  echo "Uploading via rclone to $BACKUP_RCLONE_REMOTE..."
  rclone copy "$FILE" "$BACKUP_RCLONE_REMOTE"
  echo "Upload complete: $BACKUP_RCLONE_REMOTE/$(basename "$FILE")"
else
  echo "WARNING: BACKUP_S3_BUCKET / BACKUP_RCLONE_REMOTE not set or aws/rclone not installed — backup is ONLY local. Configure off-server storage before going live (Section 6)." >&2
  echo "  Example (R2): BACKUP_S3_BUCKET=s3://adnavra-backups aws s3 cp $FILE s3://adnavra-backups/ --endpoint-url \$AWS_ENDPOINT_URL_S3" >&2
fi

# ── Verify ────────────────────────────────────────────────────────
if [ -f "$FILE" ]; then
  SIZE=$(du -h "$FILE" | cut -f1)
  echo "Verified: $FILE ($SIZE)"
else
  echo "ERROR: backup file missing after dump" >&2
  exit 1
fi
