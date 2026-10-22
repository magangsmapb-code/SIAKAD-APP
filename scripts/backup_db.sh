#!/bin/bash
# ==============================================================================
# SIAKAD Production Database Backup Script (Linux/VPS)
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/siakad_db_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "=== SIAKAD DATABASE BACKUP ==="
echo "Timestamp: $(date)"
echo "Target: ${BACKUP_FILE}"

# If running inside docker compose
if command -v docker >/dev/null 2>&1 && docker ps | grep -q siakad_prod_postgres; then
    echo "Dumping from Docker container 'siakad_prod_postgres'..."
    docker exec siakad_prod_postgres pg_dump -U "${POSTGRES_USER:-siakad_admin}" -d "${POSTGRES_DB:-siakad_prod_db}" --clean --if-exists | gzip > "$BACKUP_FILE"
else
    # Host-level pg_dump
    PGHOST="${PGHOST:-localhost}"
    PGPORT="${PGPORT:-5432}"
    PGUSER="${PGUSER:-postgres}"
    PGDATABASE="${PGDATABASE:-siakad_db}"
    
    pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" --clean --if-exists | gzip > "$BACKUP_FILE"
fi

if [ -s "$BACKUP_FILE" ]; then
    SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "SUCCESS: Backup completed successfully. File size: ${SIZE}"
else
    echo "ERROR: Backup file is empty or failed to generate!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Retention policy: Remove backups older than 7 days
echo "Applying 7-day retention cleanup..."
find "$BACKUP_DIR" -name "siakad_db_*.sql.gz" -type f -mtime +7 -delete

echo "Done."
