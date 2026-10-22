# ==============================================================================
# SIAKAD Production Database Restore & Disaster Recovery Script (PowerShell)
# ==============================================================================
param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$PsqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    [string]$DbHost = "localhost",
    [int]$Port = 5432,
    [string]$User = "postgres",
    [string]$Database = "siakad_db",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    throw "Backup file '$BackupFile' does not exist."
}

Write-Host "=== SIAKAD DATABASE RESTORE ===" -ForegroundColor Yellow
Write-Host "Backup File : $BackupFile"
Write-Host "Target DB   : $Database ($DbHost`:$Port)"

if (-not $Force) {
    $confirm = Read-Host "WARNING: Restoring will overwrite existing data. Type 'yes' to proceed"
    if ($confirm -ne "yes") {
        Write-Host "Restore cancelled." -ForegroundColor Gray
        exit
    }
}

if (-not (Test-Path $PsqlPath)) {
    $found = Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $PsqlPath = $found.FullName
    } else {
        throw "psql.exe not found at $PsqlPath. Please specify -PsqlPath parameter."
    }
}

Write-Host "Executing restore using $PsqlPath..." -ForegroundColor Cyan
& $PsqlPath -v ON_ERROR_STOP=1 -h $DbHost -p $Port -U $User -d $Database -f $BackupFile
if ($LASTEXITCODE -ne 0) {
    throw "psql restore failed with exit code $LASTEXITCODE. Inspect the target database before retrying."
}

Write-Host "SUCCESS: Database restore executed successfully." -ForegroundColor Green
