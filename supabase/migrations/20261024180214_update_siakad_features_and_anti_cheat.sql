-- =============================================================================
-- Migration: 20261024180214_update_siakad_features_and_anti_cheat.sql
-- SIAKAD SMA Pemberdayaan Bangsa Ngrayun, Ponorogo
-- Supabase Cloud PostgreSQL Schema Update
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums and Type Extensions (Idempotent)
-- -----------------------------------------------------------------------------

-- Extend Role enum with DEVELOPER
DO $$ BEGIN
    ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DEVELOPER';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Extend AttendanceStatus enum
DO $$ BEGIN
    ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'MENUNGGU_VERIFIKASI';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'DITOLAK';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'DIKOREKSI';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create AnomalySeverity enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnomalySeverity') THEN
        CREATE TYPE "AnomalySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create AnomalyStatus enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnomalyStatus') THEN
        CREATE TYPE "AnomalyStatus" AS ENUM ('PENDING_REVIEW', 'INVESTIGATING', 'RESOLVED_FALSE_POSITIVE', 'RESOLVED_CONFIRMED_FRAUD', 'DISMISSED');
    END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create FeatureImplementationStatus enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FeatureImplementationStatus') THEN
        CREATE TYPE "FeatureImplementationStatus" AS ENUM ('IMPLEMENTED', 'IN_PROGRESS', 'NOT_IMPLEMENTED');
    END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create FeatureMaintenanceStatus enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FeatureMaintenanceStatus') THEN
        CREATE TYPE "FeatureMaintenanceStatus" AS ENUM ('ACTIVE', 'MAINTENANCE');
    END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;


-- -----------------------------------------------------------------------------
-- 2. Enhance Existing Tables with Anti-Cheat & RFID Telemetry
-- -----------------------------------------------------------------------------

-- Students: RFID Physical UID
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "rfidCardUid" TEXT;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_rfidCardUid_key') THEN
        ALTER TABLE "students" ADD CONSTRAINT "students_rfidCardUid_key" UNIQUE ("rfidCardUid");
    END IF;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN null;
END $$;

-- Attendance Records: Geofencing & Device Binding Telemetry
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

-- Teacher Attendances: Geofencing & Device Binding Telemetry
ALTER TABLE "teacher_attendances" ADD COLUMN IF NOT EXISTS "gpsAccuracyMeters" DOUBLE PRECISION;
ALTER TABLE "teacher_attendances" ADD COLUMN IF NOT EXISTS "isInsideGeofence" BOOLEAN;
ALTER TABLE "teacher_attendances" ADD COLUMN IF NOT EXISTS "deviceId" TEXT;
ALTER TABLE "teacher_attendances" ADD COLUMN IF NOT EXISTS "deviceModel" TEXT;
ALTER TABLE "teacher_attendances" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "teacher_attendances" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "teacher_attendances" ADD COLUMN IF NOT EXISTS "nonce" TEXT;

CREATE INDEX IF NOT EXISTS "teacher_attendances_deviceId_idx" ON "teacher_attendances"("deviceId");

-- Attendance Config: Device Binding & Anti-Spoofing Thresholds
ALTER TABLE "attendance_configs" ADD COLUMN IF NOT EXISTS "maxGpsAccuracyMeters" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "attendance_configs" ADD COLUMN IF NOT EXISTS "requireDeviceBinding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "attendance_configs" ADD COLUMN IF NOT EXISTS "maxDevicesPerUser" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "attendance_configs" ADD COLUMN IF NOT EXISTS "preventSimultaneousLogins" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "attendance_configs" ADD COLUMN IF NOT EXISTS "replayWindowSeconds" INTEGER NOT NULL DEFAULT 60;


-- -----------------------------------------------------------------------------
-- 3. Create Tables: Anti-Cheat & Attendance Governance
-- -----------------------------------------------------------------------------

-- Table: Attendance Anomalies (Audit & Fraud Monitoring)
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

-- Table: Attendance Devices (Hardware & Mobile Fingerprint Binding)
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

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_devices_userId_deviceId_key') THEN
        ALTER TABLE "attendance_devices" ADD CONSTRAINT "attendance_devices_userId_deviceId_key" UNIQUE ("userId", "deviceId");
    END IF;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_devices_userId_fkey') THEN
        ALTER TABLE "attendance_devices" ADD CONSTRAINT "attendance_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "attendance_devices_userId_idx" ON "attendance_devices"("userId");
CREATE INDEX IF NOT EXISTS "attendance_devices_deviceId_idx" ON "attendance_devices"("deviceId");

-- Table: Attendance Corrections (Student & Teacher Self-Correction Flow)
CREATE TABLE IF NOT EXISTS "attendance_corrections" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "previousStatus" "AttendanceStatus" NOT NULL,
    "newStatus" "AttendanceStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "correctedById" TEXT NOT NULL,
    "status" "PermissionStatus" NOT NULL DEFAULT 'MENUNGGU',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_corrections_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_corrections_recordId_fkey') THEN
        ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "attendance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_corrections_sessionId_fkey') THEN
        ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "attendance_corrections_recordId_idx" ON "attendance_corrections"("recordId");
CREATE INDEX IF NOT EXISTS "attendance_corrections_sessionId_idx" ON "attendance_corrections"("sessionId");
CREATE INDEX IF NOT EXISTS "attendance_corrections_status_idx" ON "attendance_corrections"("status");


-- -----------------------------------------------------------------------------
-- 4. Create Tables: Feature Registry & Developer Governance
-- -----------------------------------------------------------------------------

-- Table: Feature Registry
CREATE TABLE IF NOT EXISTS "feature_registries" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "implementationStatus" "FeatureImplementationStatus" NOT NULL DEFAULT 'IMPLEMENTED',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceStatus" "FeatureMaintenanceStatus" NOT NULL DEFAULT 'ACTIVE',
    "maintenanceMessage" TEXT,
    "requiredPermissions" TEXT[] NOT NULL DEFAULT '{}',
    "dependencies" TEXT[] NOT NULL DEFAULT '{}',
    "updatedById" TEXT,
    "updatedByName" TEXT,
    "lastChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_registries_pkey" PRIMARY KEY ("key")
);

-- Table: Role Permissions (RBAC Permission Matrix)
CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_permissionKey_key') THEN
        ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_permissionKey_key" UNIQUE ("role", "permissionKey");
    END IF;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "role_permissions_permissionKey_idx" ON "role_permissions"("permissionKey");


-- -----------------------------------------------------------------------------
-- 5. Row Level Security (RLS) Best Practices
-- -----------------------------------------------------------------------------

ALTER TABLE "attendance_anomalies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_devices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_corrections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feature_registries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;

-- Allow service_role to manage all tables
DO $$ BEGIN
    DROP POLICY IF EXISTS "service_role_all_anomalies" ON "attendance_anomalies";
    CREATE POLICY "service_role_all_anomalies" ON "attendance_anomalies" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "service_role_all_devices" ON "attendance_devices";
    CREATE POLICY "service_role_all_devices" ON "attendance_devices" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "service_role_all_corrections" ON "attendance_corrections";
    CREATE POLICY "service_role_all_corrections" ON "attendance_corrections" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "service_role_all_features" ON "feature_registries";
    CREATE POLICY "service_role_all_features" ON "feature_registries" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "service_role_all_role_permissions" ON "role_permissions";
    CREATE POLICY "service_role_all_role_permissions" ON "role_permissions" FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN null;
END $$;

-- Public and Authenticated Read Access for Feature Registries
DO $$ BEGIN
    DROP POLICY IF EXISTS "public_read_features" ON "feature_registries";
    CREATE POLICY "public_read_features" ON "feature_registries" FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN undefined_table THEN null;
END $$;
