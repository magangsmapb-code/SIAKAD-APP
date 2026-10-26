-- =============================================================================
-- Migration: 20261025024237_add_student_grades_module.sql
-- SIAKAD SMA Pemberdayaan Bangsa Ngrayun, Ponorogo
-- Kurikulum Merdeka Grades & Academic Reporting System
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums and Type Definitions (Idempotent)
-- -----------------------------------------------------------------------------

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GradePredicate') THEN
        CREATE TYPE "GradePredicate" AS ENUM ('A', 'B', 'C', 'D');
    END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssessmentType') THEN
        CREATE TYPE "AssessmentType" AS ENUM ('FORMATIF', 'SUMATIF_MATERI', 'PTS', 'PAS');
    END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Table: Student Grades (Kurikulum Merdeka)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "student_grades" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "semester" "Semester" NOT NULL DEFAULT 'GANJIL',
    "teacherId" TEXT,
    "formatif" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sumatifMateri" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "predicate" "GradePredicate" NOT NULL DEFAULT 'B',
    "kktp" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "isPassed" BOOLEAN NOT NULL DEFAULT true,
    "competencySummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_grades_pkey" PRIMARY KEY ("id")
);

-- Unique constraint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_grades_studentId_subjectId_academicYearId_semester_key') THEN
        ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_studentId_subjectId_academicYearId_semester_key" 
            UNIQUE ("studentId", "subjectId", "academicYearId", "semester");
    END IF;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN null;
END $$;

-- Foreign Keys
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_grades_studentId_fkey') THEN
        ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_studentId_fkey" 
            FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_grades_subjectId_fkey') THEN
        ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_subjectId_fkey" 
            FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_grades_classId_fkey') THEN
        ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_classId_fkey" 
            FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_grades_academicYearId_fkey') THEN
        ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_academicYearId_fkey" 
            FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_grades_teacherId_fkey') THEN
        ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_teacherId_fkey" 
            FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
EXCEPTION WHEN duplicate_table OR duplicate_object THEN null;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "student_grades_studentId_idx" ON "student_grades"("studentId");
CREATE INDEX IF NOT EXISTS "student_grades_classId_idx" ON "student_grades"("classId");
CREATE INDEX IF NOT EXISTS "student_grades_subjectId_idx" ON "student_grades"("subjectId");
CREATE INDEX IF NOT EXISTS "student_grades_academicYearId_idx" ON "student_grades"("academicYearId");
CREATE INDEX IF NOT EXISTS "student_grades_teacherId_idx" ON "student_grades"("teacherId");

-- -----------------------------------------------------------------------------
-- 3. Row Level Security (RLS)
-- -----------------------------------------------------------------------------

ALTER TABLE "student_grades" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'student_grades' AND policyname = 'student_grades_service_role_all'
    ) THEN
        CREATE POLICY "student_grades_service_role_all" ON "student_grades"
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'student_grades' AND policyname = 'student_grades_authenticated_read'
    ) THEN
        CREATE POLICY "student_grades_authenticated_read" ON "student_grades"
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'student_grades' AND policyname = 'student_grades_authenticated_write'
    ) THEN
        CREATE POLICY "student_grades_authenticated_write" ON "student_grades"
            FOR ALL TO authenticated USING (
                auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'DEVELOPER', 'ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
            ) WITH CHECK (
                auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'DEVELOPER', 'ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
            );
    END IF;
END $$;
