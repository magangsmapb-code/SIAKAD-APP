-- AlterTable: Enhanced attendance corrections with workflow status
ALTER TABLE "attendance_corrections" ADD COLUMN IF NOT EXISTS "status" "PermissionStatus" NOT NULL DEFAULT 'MENUNGGU';
ALTER TABLE "attendance_corrections" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;
ALTER TABLE "attendance_corrections" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "attendance_corrections" ADD COLUMN IF NOT EXISTS "reviewNotes" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendance_corrections_status_idx" ON "attendance_corrections"("status");

-- CreateTable: Teacher personal daily attendance
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Global centralized attendance policy and developer configuration
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

-- CreateIndex
CREATE INDEX IF NOT EXISTS "teacher_attendances_teacherId_idx" ON "teacher_attendances"("teacherId");
CREATE INDEX IF NOT EXISTS "teacher_attendances_date_idx" ON "teacher_attendances"("date");
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'teacher_attendances_teacherId_date_key'
    ) THEN
        ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_teacherId_date_key" UNIQUE ("teacherId", "date");
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'teacher_attendances_teacherId_fkey'
    ) THEN
        ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
