-- =============================================================================
-- Migration: Add Anti-Cheat & Multi-Layer Attendance Defense Models & Fields
-- SIAKAD SMA Pemberdayaan Bangsa Ngrayun
-- =============================================================================

-- 1. Extend AttendanceStatus Enum
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'MENUNGGU_VERIFIKASI';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'DITOLAK';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'DIKOREKSI';

-- 2. Create Anomaly Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnomalySeverity') THEN
        CREATE TYPE "AnomalySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnomalyStatus') THEN
        CREATE TYPE "AnomalyStatus" AS ENUM ('PENDING_REVIEW', 'INVESTIGATING', 'RESOLVED_FALSE_POSITIVE', 'RESOLVED_CONFIRMED_FRAUD', 'DISMISSED');
    END IF;
END $$;

-- 3. Enhance AttendanceRecord with Anti-Cheat & Geolocation telemetry
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "checkOutTime" TIMESTAMP(3);
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "gpsAccuracyMeters" DOUBLE PRECISION;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "distanceMeters" DOUBLE PRECISION;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "isInsideGeofence" BOOLEAN;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "deviceId" TEXT;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "deviceModel" TEXT;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "nonce" TEXT;

CREATE INDEX IF NOT EXISTS "attendance_records_deviceId_idx" ON "attendance_records"("deviceId");
CREATE INDEX IF NOT EXISTS "attendance_records_recordedAt_idx" ON "attendance_records"("recordedAt");

-- 4. Enhance TeacherAttendance with Anti-Cheat telemetry
ALTER TABLE "teacher_attendances" ADD COLUMN IF NOT EXISTS "gpsAccuracyMeters" DOUBLE PRECISION;
ALTER TABLE "teacher_attendances" ADD COLUMN IF NOT EXISTS "isInsideGeofence" BOOLEAN;
ALTER TABLE "teacher_attendances" ADD COLUMN IF NOT EXISTS "deviceId" TEXT;
ALTER TABLE "teacher_attendances" ADD COLUMN IF NOT EXISTS "deviceModel" TEXT;
ALTER TABLE "teacher_attendances" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "teacher_attendances" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "teacher_attendances" ADD COLUMN IF NOT EXISTS "nonce" TEXT;

CREATE INDEX IF NOT EXISTS "teacher_attendances_deviceId_idx" ON "teacher_attendances"("deviceId");

-- 5. Enhance AttendanceConfig with Anti-Cheat Policy & Device Binding thresholds
ALTER TABLE "attendance_configs" ADD COLUMN IF NOT EXISTS "maxGpsAccuracyMeters" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "attendance_configs" ADD COLUMN IF NOT EXISTS "requireDeviceBinding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "attendance_configs" ADD COLUMN IF NOT EXISTS "maxDevicesPerUser" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "attendance_configs" ADD COLUMN IF NOT EXISTS "preventSimultaneousLogins" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "attendance_configs" ADD COLUMN IF NOT EXISTS "replayWindowSeconds" INTEGER NOT NULL DEFAULT 60;

-- 6. Create Table: Attendance Anomalies (Security Telemetry & Anti-Fraud Log)
CREATE TABLE IF NOT EXISTS "attendance_anomalies" (
    "id" TEXT NOT NULL,
    "anomalyType" TEXT NOT NULL,
    "severity" "AnomalySeverity" NOT NULL DEFAULT 'MEDIUM',
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "targetId" TEXT,
    "details" TEXT NOT NULL,
    "coords" JSONB,
    "deviceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" "AnomalyStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_anomalies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "attendance_anomalies_userId_idx" ON "attendance_anomalies"("userId");
CREATE INDEX IF NOT EXISTS "attendance_anomalies_anomalyType_idx" ON "attendance_anomalies"("anomalyType");
CREATE INDEX IF NOT EXISTS "attendance_anomalies_status_idx" ON "attendance_anomalies"("status");
CREATE INDEX IF NOT EXISTS "attendance_anomalies_createdAt_idx" ON "attendance_anomalies"("createdAt");

-- 7. Create Table: Attendance Devices (Hardware & Mobile Device Binding)
CREATE TABLE IF NOT EXISTS "attendance_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceModel" TEXT,
    "osVersion" TEXT,
    "appVersion" TEXT,
    "isTrusted" BOOLEAN NOT NULL DEFAULT true,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_devices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "attendance_devices_userId_idx" ON "attendance_devices"("userId");
CREATE INDEX IF NOT EXISTS "attendance_devices_deviceId_idx" ON "attendance_devices"("deviceId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'attendance_devices_userId_deviceId_key'
    ) THEN
        ALTER TABLE "attendance_devices" ADD CONSTRAINT "attendance_devices_userId_deviceId_key" UNIQUE ("userId", "deviceId");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'attendance_devices_userId_fkey'
    ) THEN
        ALTER TABLE "attendance_devices" ADD CONSTRAINT "attendance_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
