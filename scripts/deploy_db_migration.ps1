# ==============================================================================
# SIAKAD Production Database Migration Procedure (PowerShell)
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host "=== SIAKAD PRODUCTION DATABASE MIGRATION ===" -ForegroundColor Cyan

# 1. Pre-flight Backup
Write-Host "Step 1: Creating safety backup before migration..." -ForegroundColor Yellow
& ".\scripts\backup_db.ps1"

# 2. Check Migration Status
Write-Host "Step 2: Checking pending Prisma migrations..." -ForegroundColor Yellow
Set-Location -Path "apps\api"
try {
    npx prisma migrate status
    
    Write-Host "Step 3: Applying pending migrations with 'prisma migrate deploy'..." -ForegroundColor Yellow
    npx prisma migrate deploy
    
    Write-Host "Step 4: Confirming schema synchronization..." -ForegroundColor Yellow
    npx prisma migrate status
    
    Write-Host "✅ SUCCESS: Database migration deployed successfully." -ForegroundColor Green
} finally {
    Set-Location -Path "..\.."
}
