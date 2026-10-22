#!/bin/sh
# ==============================================================================
# SIAKAD Production Automated PostgreSQL Backup Cron Script
# Runs inside the backup-cron container on a 24-hour cycle with retention policy
# ==============================================================================

set -e

echo "[$(date)] Starting SIAKAD automated backup daemon..."
mkdir -p "$BACKUP_DIR"

while true; do
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/siakad_backup_${TIMESTAMP}.sql.gz"
    
    echo "[$(date)] Initiating database backup to ${BACKUP_FILE}..."
    
    # Execute pg_dump and compress via gzip
    if pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" --format=plain --no-owner --clean --if-exists | gzip > "$BACKUP_FILE"; then
        FILESIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        echo "[$(date)] SUCCESS: Database backup created successfully (${FILESIZE})"
    else
        echo "[$(date)] ERROR: pg_dump failed! Check database connectivity and credentials."
        rm -f "$BACKUP_FILE"
    fi

    # Enforce retention policy (delete backups older than RETENTION_DAYS)
    echo "[$(date)] Purging backup archives older than ${RETENTION_DAYS} days..."
    find "$BACKUP_DIR" -type f -name "siakad_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;
    
    echo "[$(date)] Current backups in archive:"
    ls -lh "$BACKUP_DIR"
    
    echo "[$(date)] Sleeping for 24 hours (86400 seconds) until next scheduled backup..."
    sleep 86400
done
