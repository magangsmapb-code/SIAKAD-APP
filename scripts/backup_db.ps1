# ==============================================================================
# SIAKAD Production Database Backup Script (PowerShell / Windows)
# ==============================================================================
param (
    [string]$BackupDir = ".\backups",
    [string]$PgDumpPath = "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
    [string]$DbHost = "localhost",
    [int]$Port = 5432,
    [string]$User = "postgres",
    [string]$Database = "siakad_db"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$sqlFile = Join-Path $BackupDir "siakad_db_$timestamp.sql"

Write-Host "=== SIAKAD DATABASE BACKUP ===" -ForegroundColor Cyan
Write-Host "Timestamp : $(Get-Date)"
Write-Host "Database  : $Database ($DbHost`:$Port)"
Write-Host "Target    : $sqlFile"

if (-not (Test-Path $PgDumpPath)) {
    $found = Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Recurse -Filter "pg_dump.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $PgDumpPath = $found.FullName
    } else {
        throw "pg_dump.exe not found at $PgDumpPath. Please specify -PgDumpPath parameter."
    }
}

& $PgDumpPath -h $DbHost -p $Port -U $User -d $Database --clean --if-exists -f $sqlFile
if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed with exit code $LASTEXITCODE. Verify the target and preserve the partial dump for inspection."
}

if ((Test-Path $sqlFile) -and ((Get-Item $sqlFile).Length -gt 0)) {
    $sizeKb = [math]::Round(((Get-Item $sqlFile).Length / 1KB), 2)
    Write-Host "SUCCESS: Database backup generated successfully ($sizeKb KB)" -ForegroundColor Green
} else {
    throw "ERROR: Backup file was not created or is empty."
}

# Retention cleanup (keep last 7 days)
Write-Host "Cleaning up backups older than 7 days..." -ForegroundColor Gray
Get-ChildItem -Path $BackupDir -Filter "siakad_db_*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item -Force
Write-Host "Backup procedure finished." -ForegroundColor Green
