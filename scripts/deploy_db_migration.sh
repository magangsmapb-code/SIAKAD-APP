#!/bin/bash
# ==============================================================================
# SIAKAD Production Database Migration Procedure
# Safely executes Prisma migrations with mandatory pre-flight backup check
# ==============================================================================
set -e

echo "=== SIAKAD PRODUCTION DATABASE MIGRATION PROCEDURE ==="
echo "Date: $(date)"

# 1. Pre-flight verification
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set."
    exit 1
fi

echo "Step 1: Creating mandatory safety backup before applying migrations..."
./scripts/backup_db.sh

echo "Step 2: Checking pending migration status..."
cd apps/api
npx prisma migrate status

echo "Step 3: Deploying pending migrations with 'prisma migrate deploy'..."
# NOTE: Never use 'migrate dev' or 'db push' or 'migrate reset' in production!
npx prisma migrate deploy

echo "Step 4: Verifying schema integrity..."
npx prisma migrate status

echo "✅ SUCCESS: Database migrations applied cleanly without data loss."
