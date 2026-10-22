#!/bin/bash
# ==============================================================================
# SIAKAD Production Database Restore & Disaster Recovery Script (Linux/VPS)
# ==============================================================================
set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    echo "Available backups in ./backups:"
    ls -lh ./backups/siakad_db_*.sql.gz 2>/dev/null || echo "No backups found."
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file '$BACKUP_FILE' does not exist!"
    exit 1
fi

echo "=== SIAKAD DATABASE RESTORE (DISASTER RECOVERY) ==="
echo "WARNING: Restoring will overwrite existing data in the target database!"
echo "Source: $BACKUP_FILE"
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled by user."
    exit 0
fi

# If running inside docker compose
if command -v docker >/dev/null 2>&1 && docker ps | grep -q siakad_prod_postgres; then
    echo "Restoring to Docker container 'siakad_prod_postgres'..."
    gunzip -c "$BACKUP_FILE" | docker exec -i siakad_prod_postgres psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-siakad_admin}" -d "${POSTGRES_DB:-siakad_prod_db}"
else
    # Host-level psql
    PGHOST="${PGHOST:-localhost}"
    PGPORT="${PGPORT:-5432}"
    PGUSER="${PGUSER:-postgres}"
    PGDATABASE="${PGDATABASE:-siakad_db}"
    
    echo "Restoring to host database ${PGDATABASE} on ${PGHOST}:${PGPORT}..."
    gunzip -c "$BACKUP_FILE" | psql -v ON_ERROR_STOP=1 -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE"
fi

echo "SUCCESS: Database restore completed successfully."
