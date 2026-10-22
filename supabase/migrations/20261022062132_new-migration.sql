-- =============================================================================
-- SIAKAD Database Schema - SMA Pemberdayaan Bangsa Ngrayun
-- Baseline Migration for Supabase Cloud Database (PostgreSQL)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create Enums (Idempotent)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'DEVELOPER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DEVELOPER';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Gender" AS ENUM ('L', 'P');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "StudentStatus" AS ENUM ('AKTIF', 'LULUS', 'MUTASI', 'NON_AKTIF');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TeacherStatus" AS ENUM ('AKTIF', 'CUTI', 'NON_AKTIF');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ClassLevel" AS ENUM ('X', 'XI', 'XII');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Major" AS ENUM ('MIPA', 'IPS', 'UMUM');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubjectCategory" AS ENUM ('WAJIB', 'PEMINATAN', 'MUATAN_LOKAL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DayOfWeek" AS ENUM ('SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AttendanceStatus" AS ENUM ('HADIR', 'TERLAMBAT', 'SAKIT', 'IZIN', 'ALPA');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AttendanceMethod" AS ENUM ('MANUAL_TEACHER', 'QR_CODE', 'RFID_CARD', 'FINGERPRINT', 'FACE_RECOGNITION', 'SELF_MOBILE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE "AttendanceMethod" ADD VALUE IF NOT EXISTS 'SELF_MOBILE';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SessionStatus" AS ENUM ('BELUM_DIMULAI', 'SEDANG_BERLANGSUNG', 'SUDAH_DISIMPAN', 'PERLU_DIPERIKSA', 'DITUTUP');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PermissionType" AS ENUM ('SAKIT', 'IZIN', 'DISPENSASI');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PermissionStatus" AS ENUM ('MENUNGGU', 'DISETUJUI', 'DITOLAK');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Semester" AS ENUM ('GANJIL', 'GENAP');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FeatureImplementationStatus" AS ENUM ('IMPLEMENTED', 'IN_PROGRESS', 'NOT_IMPLEMENTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "FeatureMaintenanceStatus" AS ENUM ('ACTIVE', 'MAINTENANCE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Core Tables
-- -----------------------------------------------------------------------------

-- users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- teachers
CREATE TABLE IF NOT EXISTS "teachers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "nuptk" TEXT,
    "fullName" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "roleTitle" TEXT,
    "isHomeroom" BOOLEAN NOT NULL DEFAULT false,
    "status" "TeacherStatus" NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- students
CREATE TABLE IF NOT EXISTS "students" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "nisn" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "classId" TEXT NOT NULL,
    "phone" TEXT,
    "parentName" TEXT,
    "parentPhone" TEXT,
    "address" TEXT,
    "rfidCardUid" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- academic_years
CREATE TABLE IF NOT EXISTS "academic_years" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "semester" "Semester" NOT NULL DEFAULT 'GANJIL',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- classes
CREATE TABLE IF NOT EXISTS "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "ClassLevel" NOT NULL,
    "major" "Major" NOT NULL DEFAULT 'MIPA',
    "roomNumber" TEXT,
    "academicYearId" TEXT NOT NULL,
    "homeroomTeacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- class_enrollments
CREATE TABLE IF NOT EXISTS "class_enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "class_enrollments_pkey" PRIMARY KEY ("id")
);

-- subjects
CREATE TABLE IF NOT EXISTS "subjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SubjectCategory" NOT NULL DEFAULT 'WAJIB',
    "creditHours" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- teaching_assignments
CREATE TABLE IF NOT EXISTS "teaching_assignments" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teaching_assignments_pkey" PRIMARY KEY ("id")
);

-- schedules
CREATE TABLE IF NOT EXISTS "schedules" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- school_settings
CREATE TABLE IF NOT EXISTS "school_settings" (
    "id" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL DEFAULT 'SMA Pemberdayaan Bangsa Ngrayun',
    "npsn" TEXT NOT NULL DEFAULT '20512345',
    "address" TEXT NOT NULL DEFAULT 'Jl. Raya Ngrayun No. 45, Ponorogo, Jawa Timur 63464',
    "phone" TEXT NOT NULL DEFAULT '(0352) 123456',
    "email" TEXT NOT NULL DEFAULT 'info@smapbngrayun.sch.id',
    "minAttendancePercentage" DOUBLE PRECISION NOT NULL DEFAULT 90.0,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "allowSelfPermission" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "school_settings_pkey" PRIMARY KEY ("id")
);

-- attendance_sessions
CREATE TABLE IF NOT EXISTS "attendance_sessions" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'SEDANG_BERLANGSUNG',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- attendance_records
CREATE TABLE IF NOT EXISTS "attendance_records" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'HADIR',
    "checkInTime" TIMESTAMP(3),
    "method" "AttendanceMethod" NOT NULL DEFAULT 'MANUAL_TEACHER',
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- attendance_corrections
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

-- teacher_attendances
CREATE TABLE IF NOT EXISTS "teacher_attendances" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL,
    "checkOutTime" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'HADIR',
    "method" "AttendanceMethod" NOT NULL DEFAULT 'MANUAL_TEACHER',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "distanceMeters" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teacher_attendances_pkey" PRIMARY KEY ("id")
);

-- attendance_configs
CREATE TABLE IF NOT EXISTS "attendance_configs" (
    "id" TEXT NOT NULL,
    "checkInStartTime" TEXT NOT NULL DEFAULT '06:30',
    "checkInEndTime" TEXT NOT NULL DEFAULT '07:30',
    "lateThresholdTime" TEXT NOT NULL DEFAULT '07:00',
    "lateToleranceMinutes" INTEGER NOT NULL DEFAULT 15,
    "checkOutStartTime" TEXT NOT NULL DEFAULT '14:00',
    "checkOutEndTime" TEXT NOT NULL DEFAULT '16:00',
    "enableGps" BOOLEAN NOT NULL DEFAULT false,
    "schoolLatitude" DOUBLE PRECISION NOT NULL DEFAULT -8.0435,
    "schoolLongitude" DOUBLE PRECISION NOT NULL DEFAULT 111.4123,
    "maxGpsRadiusMeters" INTEGER NOT NULL DEFAULT 100,
    "allowedMethods" TEXT NOT NULL DEFAULT '["MANUAL_TEACHER","QR_CODE","RFID_CARD","FACE_RECOGNITION","SELF_MOBILE"]',
    "allowStudentSelfCheckIn" BOOLEAN NOT NULL DEFAULT false,
    "allowTeacherSelfCheckIn" BOOLEAN NOT NULL DEFAULT true,
    "requirePhotoVerification" BOOLEAN NOT NULL DEFAULT false,
    "requireCorrectionApproval" BOOLEAN NOT NULL DEFAULT true,
    "correctionApproverRole" TEXT NOT NULL DEFAULT 'TEACHER_HOMEROOM',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "updatedById" TEXT,
    "updatedByName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attendance_configs_pkey" PRIMARY KEY ("id")
);

-- permission_requests
CREATE TABLE IF NOT EXISTS "permission_requests" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "type" "PermissionType" NOT NULL DEFAULT 'IZIN',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "totalDays" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT NOT NULL,
    "attachmentName" TEXT,
    "attachmentUrl" TEXT,
    "status" "PermissionStatus" NOT NULL DEFAULT 'MENUNGGU',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permission_requests_pkey" PRIMARY KEY ("id")
);

-- feature_registries
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
    "requiredPermissions" TEXT[],
    "dependencies" TEXT[],
    "updatedById" TEXT,
    "updatedByName" TEXT,
    "lastChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feature_registries_pkey" PRIMARY KEY ("key")
);

-- role_permissions
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

-- -----------------------------------------------------------------------------
-- 3. Unique Constraints and Indexes
-- -----------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

CREATE UNIQUE INDEX IF NOT EXISTS "teachers_userId_key" ON "teachers"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "teachers_nip_key" ON "teachers"("nip");

CREATE UNIQUE INDEX IF NOT EXISTS "students_userId_key" ON "students"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "students_nis_key" ON "students"("nis");
CREATE UNIQUE INDEX IF NOT EXISTS "students_nisn_key" ON "students"("nisn");
CREATE UNIQUE INDEX IF NOT EXISTS "students_rfidCardUid_key" ON "students"("rfidCardUid");
CREATE INDEX IF NOT EXISTS "students_classId_idx" ON "students"("classId");

CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");

CREATE UNIQUE INDEX IF NOT EXISTS "academic_years_name_semester_key" ON "academic_years"("name", "semester");

CREATE INDEX IF NOT EXISTS "classes_academicYearId_idx" ON "classes"("academicYearId");
CREATE INDEX IF NOT EXISTS "classes_homeroomTeacherId_idx" ON "classes"("homeroomTeacherId");
CREATE UNIQUE INDEX IF NOT EXISTS "classes_name_academicYearId_key" ON "classes"("name", "academicYearId");

CREATE INDEX IF NOT EXISTS "class_enrollments_studentId_idx" ON "class_enrollments"("studentId");
CREATE INDEX IF NOT EXISTS "class_enrollments_classId_idx" ON "class_enrollments"("classId");
CREATE UNIQUE INDEX IF NOT EXISTS "class_enrollments_studentId_classId_academicYearId_key" ON "class_enrollments"("studentId", "classId", "academicYearId");

CREATE UNIQUE INDEX IF NOT EXISTS "subjects_code_key" ON "subjects"("code");

CREATE INDEX IF NOT EXISTS "teaching_assignments_teacherId_idx" ON "teaching_assignments"("teacherId");
CREATE INDEX IF NOT EXISTS "teaching_assignments_classId_idx" ON "teaching_assignments"("classId");
CREATE INDEX IF NOT EXISTS "teaching_assignments_subjectId_idx" ON "teaching_assignments"("subjectId");
CREATE UNIQUE INDEX IF NOT EXISTS "teaching_assignments_teacherId_classId_subjectId_academicYe_key" ON "teaching_assignments"("teacherId", "classId", "subjectId", "academicYearId");

CREATE INDEX IF NOT EXISTS "schedules_classId_idx" ON "schedules"("classId");
CREATE INDEX IF NOT EXISTS "schedules_subjectId_idx" ON "schedules"("subjectId");
CREATE INDEX IF NOT EXISTS "schedules_teacherId_idx" ON "schedules"("teacherId");
CREATE INDEX IF NOT EXISTS "schedules_dayOfWeek_idx" ON "schedules"("dayOfWeek");

CREATE INDEX IF NOT EXISTS "attendance_sessions_classId_date_idx" ON "attendance_sessions"("classId", "date");
CREATE INDEX IF NOT EXISTS "attendance_sessions_teacherId_date_idx" ON "attendance_sessions"("teacherId", "date");
CREATE INDEX IF NOT EXISTS "attendance_sessions_status_idx" ON "attendance_sessions"("status");

CREATE INDEX IF NOT EXISTS "attendance_records_sessionId_idx" ON "attendance_records"("sessionId");
CREATE INDEX IF NOT EXISTS "attendance_records_studentId_idx" ON "attendance_records"("studentId");
CREATE INDEX IF NOT EXISTS "attendance_records_status_idx" ON "attendance_records"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_records_sessionId_studentId_key" ON "attendance_records"("sessionId", "studentId");

CREATE INDEX IF NOT EXISTS "attendance_corrections_recordId_idx" ON "attendance_corrections"("recordId");
CREATE INDEX IF NOT EXISTS "attendance_corrections_sessionId_idx" ON "attendance_corrections"("sessionId");
CREATE INDEX IF NOT EXISTS "attendance_corrections_status_idx" ON "attendance_corrections"("status");

CREATE INDEX IF NOT EXISTS "teacher_attendances_teacherId_idx" ON "teacher_attendances"("teacherId");
CREATE INDEX IF NOT EXISTS "teacher_attendances_date_idx" ON "teacher_attendances"("date");
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_attendances_teacherId_date_key') THEN
        ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_teacherId_date_key" UNIQUE ("teacherId", "date");
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "permission_requests_studentId_idx" ON "permission_requests"("studentId");
CREATE INDEX IF NOT EXISTS "permission_requests_classId_idx" ON "permission_requests"("classId");
CREATE INDEX IF NOT EXISTS "permission_requests_status_idx" ON "permission_requests"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_role_permissionKey_key" ON "role_permissions"("role", "permissionKey");
CREATE INDEX IF NOT EXISTS "role_permissions_permissionKey_idx" ON "role_permissions"("permissionKey");

-- -----------------------------------------------------------------------------
-- 4. Foreign Key Constraints
-- -----------------------------------------------------------------------------

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teachers_userId_fkey') THEN
        ALTER TABLE "teachers" ADD CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_userId_fkey') THEN
        ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_classId_fkey') THEN
        ALTER TABLE "students" ADD CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_userId_fkey') THEN
        ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'classes_academicYearId_fkey') THEN
        ALTER TABLE "classes" ADD CONSTRAINT "classes_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'classes_homeroomTeacherId_fkey') THEN
        ALTER TABLE "classes" ADD CONSTRAINT "classes_homeroomTeacherId_fkey" FOREIGN KEY ("homeroomTeacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_enrollments_studentId_fkey') THEN
        ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_enrollments_classId_fkey') THEN
        ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_enrollments_academicYearId_fkey') THEN
        ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teaching_assignments_teacherId_fkey') THEN
        ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teaching_assignments_classId_fkey') THEN
        ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teaching_assignments_subjectId_fkey') THEN
        ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teaching_assignments_academicYearId_fkey') THEN
        ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_classId_fkey') THEN
        ALTER TABLE "schedules" ADD CONSTRAINT "schedules_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_subjectId_fkey') THEN
        ALTER TABLE "schedules" ADD CONSTRAINT "schedules_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_teacherId_fkey') THEN
        ALTER TABLE "schedules" ADD CONSTRAINT "schedules_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_sessions_classId_fkey') THEN
        ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_sessions_subjectId_fkey') THEN
        ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_sessions_teacherId_fkey') THEN
        ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_sessions_scheduleId_fkey') THEN
        ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_sessionId_fkey') THEN
        ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_studentId_fkey') THEN
        ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_corrections_recordId_fkey') THEN
        ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "attendance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_corrections_sessionId_fkey') THEN
        ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_attendances_teacherId_fkey') THEN
        ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permission_requests_studentId_fkey') THEN
        ALTER TABLE "permission_requests" ADD CONSTRAINT "permission_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permission_requests_classId_fkey') THEN
        ALTER TABLE "permission_requests" ADD CONSTRAINT "permission_requests_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permission_requests_reviewedById_fkey') THEN
        ALTER TABLE "permission_requests" ADD CONSTRAINT "permission_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. Supabase Storage Bucket Setup
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'siakad-permissions',
            'siakad-permissions',
            false,
            5242880,
            ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
